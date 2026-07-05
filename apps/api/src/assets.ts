import { type Request, type Response } from 'express'
import { blobPrisma } from './db'

/**
 * Serves asset image bytes: GET /api/assets/:id.
 *
 * Asset ids are unguessable UUIDs acting as capability URLs (anyone with the
 * id can fetch the bytes), so plain <img>/texture fetches and other players'
 * boards work without auth headers. Listing/upload/delete stay owner-scoped
 * in GraphQL.
 */
export const serveAsset = async (req: Request, res: Response) => {
  try {
    const asset = await blobPrisma.asset.findUnique({
      where: { id: req.params.id ?? '' },
    })

    if (!asset) {
      res.status(404).end()
      return
    }

    res.setHeader('Content-Type', asset.mime)
    // A given id's bytes never change, so cache hard.
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
    res.send(Buffer.from(asset.data))
  } catch (error) {
    console.error('Failed to serve asset:', error)
    res.status(500).end()
  }
}
