import { Context } from '~common'
import { blobPrisma } from '../../../db'
import {
  ASSET_META_SELECT,
  requireUser,
  toAssetResponse,
} from './assetAccess'

export default {
  Query: {
    myAssets: async (_: never, __: never, context: Context) => {
      const user = requireUser(context)

      const assets = await blobPrisma.asset.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        // Bytes are served by GET /api/assets/:id, never through GraphQL.
        select: ASSET_META_SELECT,
      })

      return assets.map(toAssetResponse)
    },
  },
}
