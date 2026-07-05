import { Context } from '~common'
import { GraphQLError } from 'graphql'
import { blobPrisma } from '../../../db'
import {
  ASSET_META_SELECT,
  requireUser,
  toAssetResponse,
} from './assetAccess'

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/
const MAX_ASSET_BYTES = 10 * 1024 * 1024 // 10MB decoded
const MAX_DIMENSION = 16384

const badInput = (message: string) =>
  new GraphQLError(message, {
    extensions: {
      code: 'BAD_USER_INPUT',
      http: {
        status: 400,
      },
    },
  })

type UploadAssetArgs = {
  name: string
  dataUrl: string
  width: number
  height: number
}

export default {
  Mutation: {
    uploadAsset: async (
      _: never,
      { name, dataUrl, width, height }: UploadAssetArgs,
      context: Context,
    ) => {
      const user = requireUser(context)

      const match = dataUrl.match(DATA_URL_PATTERN)
      if (!match)
        throw badInput(
          'dataUrl must be a base64 data URL of a png, jpeg, webp, or gif image.',
        )
      const [, mime = '', base64 = ''] = match

      const data = Buffer.from(base64, 'base64')
      if (data.byteLength === 0) throw badInput('The image is empty.')
      if (data.byteLength > MAX_ASSET_BYTES)
        throw badInput('The image is larger than the 10MB limit.')

      const validDimension = (value: number) =>
        Number.isInteger(value) && value >= 1 && value <= MAX_DIMENSION
      if (!validDimension(width) || !validDimension(height))
        throw badInput('width and height must be valid pixel dimensions.')

      const asset = await blobPrisma.asset.create({
        data: {
          userId: user.id,
          name: name.trim() || 'Untitled',
          mime,
          data,
          width,
          height,
        },
        select: ASSET_META_SELECT,
      })

      return toAssetResponse(asset)
    },
  },
}
