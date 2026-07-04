import { Context } from '~common'
import { requireSessionPlayer, toGridStateResponse } from './gridStateAccess'

export default {
  Query: {
    gridState: async (
      _: never,
      { gameSessionId }: { gameSessionId: string },
      context: Context,
    ) => {
      const { prisma } = context || {}
      await requireSessionPlayer(context, gameSessionId)

      const gridState = await prisma.gridState.findUnique({
        where: { gameSessionID: parseInt(gameSessionId, 10) },
      })

      return gridState && toGridStateResponse(gridState)
    },
  },
}
