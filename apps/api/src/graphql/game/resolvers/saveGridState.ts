import { Context } from '~common'
import { GraphQLError } from 'graphql'
import { type Prisma } from '@prisma/client'
import { blobPrisma } from '../../../db'
import { requireSessionPlayer, toGridStateResponse } from './gridStateAccess'

export default {
  Mutation: {
    saveGridState: async (
      _: never,
      { gameSessionId, state }: { gameSessionId: string; state: string },
      context: Context,
    ) => {
      const gameId = await requireSessionPlayer(context, gameSessionId)

      let snapshot: Prisma.InputJsonValue
      try {
        snapshot = JSON.parse(state)
      } catch {
        throw new GraphQLError('state must be valid JSON.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            http: {
              status: 400,
            },
          },
        })
      }

      // The engine's snapshot is always a JSON object; anything else (null,
      // scalars, arrays) would corrupt the stored board.
      if (
        typeof snapshot !== 'object' ||
        snapshot === null ||
        Array.isArray(snapshot)
      )
        throw new GraphQLError('state must be a board snapshot object.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            http: {
              status: 400,
            },
          },
        })

      // Snapshots can exceed Accelerate's 5MB response cap — write direct.
      const gridState = await blobPrisma.gridState.upsert({
        where: { gameSessionID: gameId },
        create: { gameSessionID: gameId, state: snapshot },
        update: { state: snapshot },
      })

      return toGridStateResponse(gridState)
    },
  },
}
