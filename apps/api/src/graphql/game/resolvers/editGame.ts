import { Context, Game } from '~common'
import { GraphQLError } from 'graphql'

export default {
  Mutation: {
    editGame: async (
      _: never,
      { id, name, description }: Partial<Game>,
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

      const game = await prisma.game.update({
        where: {
          id: Number(id),
        },
        data: {
          name,
          description,
        },
      })
      return game
    },
  },
}
