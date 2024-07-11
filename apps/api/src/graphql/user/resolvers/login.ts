import type { Context, User } from '~common'
import { compare } from 'bcrypt'
import { GraphQLError } from 'graphql'
import {
  createAccessToken,
  createRefreshToken,
  setRefreshTokenCookie,
} from '~api/auth'

export default {
  Mutation: {
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
  },
}
