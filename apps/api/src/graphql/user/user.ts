import type { User, Context } from '~common'
import { compare, genSalt, hash } from 'bcrypt'
import { GraphQLError } from 'graphql'
import { JwtPayload, verify } from 'jsonwebtoken'
import {
  getUser,
  createAccessToken,
  createRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '~api/auth'

export default {
  Mutation: {
    signUp: async (
      _: never,
      { firstName, lastName, email, password }: Partial<User>,
      { prisma }: Context,
    ) => {
      if (!email || !password || !firstName || !lastName)
        throw new GraphQLError('All fields are required.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 400,
          },
        })

      const userExists = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userExists)
        throw new GraphQLError('The email you entered is already in use.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 400,
          },
        })

      const salt = await genSalt(10)
      const hashedPassword = await hash(password, salt)

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
        },
      })

      return user
    },
    login: async (
      _: never,
      { email, password }: Partial<User>,
      { res, prisma }: Context,
    ) => {
      if (!email || !password)
        throw new GraphQLError('All fields are required.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 400,
          },
        })

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user)
        throw new GraphQLError('The username you entered does not exist', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 401,
          },
        })

      const isMatch = await compare(password, user?.password)

      const refreshToken = createRefreshToken(user)

      if (isMatch) {
        setRefreshTokenCookie(res, refreshToken)

        return {
          accessToken: createAccessToken(user),
          user,
        }
      } else {
        throw new GraphQLError('The password you entered is incorrect', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 401,
          },
        })
      }
    },
    logout: async (_: never, __: never, context: Context) => {
      const { res, prisma, user } = context

      if (!user) throw new Error('You are not logged in.')

      await prisma.user.update({
        where: { id: user.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      })

      clearRefreshTokenCookie(res)

      return {
        message: 'Successfully logged out.',
      }
    },
    changePassword: async (
      _: never,
      args: { oldPassword: string; newPassword: string },
      context: Context,
    ) => {
      const { oldPassword, newPassword } = args
      const { prisma, user } = context

      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        })

      const { id: userId, password } = user

      const passwordIsValid = await compare(oldPassword, password)

      if (!passwordIsValid) {
        throw new GraphQLError('The old password you entered is invalid.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            httpStatus: 400,
          },
        })
      }

      const salt = await genSalt(10)
      const hashedNewPassword = await hash(newPassword, salt)

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      })

      return updatedUser
    },
    refreshToken: async (_: never, __: never, context: Context) => {
      const { req, res } = context
      const token = req?.cookies.jid

      if (!token) throw new Error('No refresh token found.')
      if (!process.env.REFRESH_TOKEN_SECRET)
        throw new Error('No refresh token secret found.')

      const { userId, tokenVersion } = verify(
        token,
        process.env.REFRESH_TOKEN_SECRET,
      ) as JwtPayload

      const user = await getUser(context, userId)

      if (!user) throw new Error('No user found.')

      if (user.tokenVersion !== Number(tokenVersion)) {
        throw new Error('Invalid refresh token.')
      }

      const newToken = createAccessToken(user)

      setRefreshTokenCookie(res, newToken)

      return {
        accessToken: newToken,
        user,
      }
    },
    revokeRefreshTokens: async (
      _: never,
      { id }: Partial<User>,
      context: Context,
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
      })
      return true
    },
  },
}