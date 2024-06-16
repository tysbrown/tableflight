import type { User } from '~common';
import type { Context } from '~api/context.js';
import { compare, genSalt, hash } from 'bcrypt';
import { GraphQLError } from 'graphql';
import { JwtPayload, verify } from 'jsonwebtoken';
import {
  getUser,
  createAccessToken,
  createRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '~api/auth.js';

export default {
  Mutation: {
    signUp: async (
      _: never,
      { firstName, lastName, email, password }: Partial<User>,
      context: Context
    ) => {
      const salt = await genSalt(10);
      password = await hash(password, salt);

      const user = await context.prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password,
        },
      });

      return user;
    },
    login: async (
      _: never,
      { email, password }: Partial<User>,
      context: Context
    ) => {
      const { res, prisma } = context;

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user)
        throw new GraphQLError('The username you entered does not exist', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 401,
          },
        });

      const isMatch = await compare(password, user?.password);

      const refreshToken = createRefreshToken(user);

      if (isMatch) {
        setRefreshTokenCookie(res, refreshToken);

        return {
          accessToken: createAccessToken(user),
          user,
        };
      } else {
        throw new GraphQLError('The password you entered is incorrect', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 401,
          },
        });
      }
    },
    logout: async (_: never, __: never, context: Context) => {
      const { res, prisma, user } = context;

      if (!user) throw new Error('You are not logged in.');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });

      clearRefreshTokenCookie(res);

      return {
        message: 'Successfully logged out.',
      };
    },
    changePassword: async (
      _: never,
      args: { oldPassword: string; newPassword: string },
      context: Context
    ) => {
      const { oldPassword, newPassword } = args;
      const { prisma, user } = context;

      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        });

      const { id: userId, password } = user;

      const passwordIsValid = await compare(oldPassword, password);

      if (!passwordIsValid) {
        throw new GraphQLError('The old password you entered is invalid.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 400,
          },
        });
      }

      const salt = await genSalt(10);
      const hashedNewPassword = await hash(newPassword, salt);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return updatedUser;
    },
    refreshToken: async (_: never, __: never, context: Context) => {
      const { req, res } = context;
      const token = req?.cookies.jid;

      if (!token) throw new Error('No refresh token found.');

      const { userId, tokenVersion } = verify(
        token,
        process.env.REFRESH_TOKEN_SECRET!
      ) as JwtPayload;

      const user = await getUser(context, userId);

      if (!user) throw new Error('No user found.');

      if (user.tokenVersion !== Number(tokenVersion)) {
        throw new Error('Invalid refresh token.');
      }

      const newToken = createAccessToken(user);

      setRefreshTokenCookie(res, newToken);

      return {
        accessToken: newToken,
        user,
      };
    },
    revokeRefreshTokens: async (
      _: never,
      { id }: Partial<User>,
      context: Context
    ) => {
      await context.prisma.user.update({
        where: {
          id: Number(id),
        },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });
      return true;
    },
  },
};
