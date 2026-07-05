import { Context } from '~common'
import { GraphQLError } from 'graphql'
import { blobPrisma } from '../../../db'
import {
  ASSET_META_SELECT,
  requireUser,
  toAssetResponse,
} from './assetAccess'

export default {
  Mutation: {
    deleteAsset: async (
      _: never,
      { id }: { id: string },
      context: Context,
    ) => {
      const user = requireUser(context)

      // Owner-scoped: the id alone is not enough, it must be yours.
      const asset = await blobPrisma.asset.findFirst({
        where: { id, userId: user.id },
        select: ASSET_META_SELECT,
      })

      if (!asset)
        throw new GraphQLError('Asset not found.', {
          extensions: {
            code: 'NOT_FOUND',
            http: {
              status: 404,
            },
          },
        })

      await blobPrisma.asset.delete({ where: { id } })
      return toAssetResponse(asset)
    },
  },
}
