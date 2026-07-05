import { Context, User } from '~common'
import { GraphQLError } from 'graphql'
import { type Asset } from '@prisma/client'

/** Everything the API returns about an asset — never the bytes. */
export type AssetMeta = Pick<
  Asset,
  'id' | 'name' | 'mime' | 'width' | 'height' | 'createdAt'
>

export const ASSET_META_SELECT = {
  id: true,
  name: true,
  mime: true,
  width: true,
  height: true,
  createdAt: true,
} as const

export const requireUser = (context: Context): User => {
  const { user } = context || {}

  if (!user)
    throw new GraphQLError('You are not authorized to make this request.', {
      extensions: {
        code: 'UNAUTHORIZED',
        http: {
          status: 401,
        },
      },
    })

  return user
}

export const toAssetResponse = (asset: AssetMeta) => ({
  id: asset.id,
  name: asset.name,
  url: `/api/assets/${asset.id}`,
  mime: asset.mime,
  width: asset.width,
  height: asset.height,
  createdAt: asset.createdAt.toISOString(),
})
