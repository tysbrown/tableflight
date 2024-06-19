import { Context } from '~common'
import { GraphQLError } from 'graphql'

export default {
  Query: {
    allGames: (_: never, __: never, context: Context) => {
      const { prisma, user } = context || {}

      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        })

      return prisma.game.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          playersParticipating: true,
        },
      })
    },
  },
}
