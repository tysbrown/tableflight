import type { Context, User } from '~common'
import { genSalt, hash } from 'bcrypt'
import { GraphQLError } from 'graphql'

export default {
  Mutation: {
    signUp: async (
      _: never,
      { firstName, lastName, email, password }: Partial<User>,
      { prisma }: Context,
    ): Promise<User> => {
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
  },
}
