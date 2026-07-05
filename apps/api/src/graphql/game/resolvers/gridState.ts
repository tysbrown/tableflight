import { Context } from '~common'
import { blobPrisma } from '../../../db'
import { requireSessionPlayer, toGridStateResponse } from './gridStateAccess'

export default {
  Query: {
    gridState: async (
      _: never,
      { gameSessionId }: { gameSessionId: string },
      context: Context,
    ) => {
      await requireSessionPlayer(context, gameSessionId)

      // Snapshots can exceed Accelerate's 5MB response cap — read direct.
      const gridState = await blobPrisma.gridState.findUnique({
        where: { gameSessionID: parseInt(gameSessionId, 10) },
      })

      return gridState && toGridStateResponse(gridState)
    },
  },
}
