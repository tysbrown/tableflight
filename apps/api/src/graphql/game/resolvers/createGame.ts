import { Context, Game } from '~common'
import { GraphQLError } from 'graphql'

export default {
  Mutation: {
    createGame: async (
      _: never,
      { name, description }: Partial<Game>,
      { prisma, user }: Context,
    ) => {
      if (!name || !description)
        throw new GraphQLError('All fields are required.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            http: {
              status: 400,
            },
          },
        })

      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        })

      const game = await prisma.game.create({
        data: {
          name,
          description,
          createdById: user.id,
        },
      })
      return game
    },
  },
}
