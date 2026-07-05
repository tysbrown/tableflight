import { Assets, Container, Sprite, Texture } from 'pixi.js'
import { MAP_PLACEHOLDER_TINT, MAP_STRIDE } from '../constants'

export type MapData = {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * One sprite per placed asset, in the engine's map order. Textures load
 * asynchronously behind a gray placeholder and are released from the Assets
 * cache when their last user goes away.
 */
export class MapsLayer {
  readonly container = new Container()
  /** Parallel to the engine's map order. */
  private sprites: { id: string; url: string; sprite: Sprite }[] = []

  constructor(private onTextureLoaded: () => void) {}

  /** Sync the sprite set with the engine's map list (on structure change). */
  sync(maps: MapData[]) {
    const previous = new Map(this.sprites.map((entry) => [entry.id, entry]))

    this.sprites = maps.map((map) => {
      const existing = previous.get(map.id)
      if (existing) {
        previous.delete(map.id)
        return existing
      }

      const sprite = new Sprite(Texture.WHITE)
      sprite.tint = MAP_PLACEHOLDER_TINT
      sprite.cullable = true
      // Asset URLs (/api/assets/:id) have no extension, so name Pixi's parser.
      void Assets.load<Texture>({ src: map.url, parser: 'loadTextures' })
        .then((texture) => {
          if (texture && !sprite.destroyed) {
            // setSize stores scale, not size, so swapping out the 1x1
            // placeholder would rescale by the texture's pixel dimensions.
            const { width, height } = sprite
            sprite.texture = texture
            sprite.setSize(width, height)
            sprite.tint = 0xffffff
            this.onTextureLoaded()
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to load an asset image:', error)
        })
      return { id: map.id, url: map.url, sprite }
    })

    for (const [, removed] of previous) {
      removed.sprite.destroy()
      this.unloadIfUnused(removed.url)
    }

    // Re-attach in map order so stacking matches the engine's draw order.
    this.container.removeChildren()
    for (const { sprite } of this.sprites) this.container.addChild(sprite)
  }

  /** Apply live geometry from the maps buffer (every content frame). */
  update(buffer: Float32Array) {
    const at = (i: number) => buffer[i] ?? 0
    this.sprites.forEach(({ sprite }, index) => {
      const base = index * MAP_STRIDE
      sprite.position.set(at(base), at(base + 1))
      sprite.setSize(at(base + 2), at(base + 3))
    })
  }

  /** Release all textures; the sprites die with the app. */
  destroy() {
    const urls = new Set(this.sprites.map((entry) => entry.url))
    this.sprites = []
    for (const url of urls) {
      void Assets.unload(url).catch(() => undefined)
    }
  }

  /** Two assets can share one image; unload only when the last one is gone. */
  private unloadIfUnused(url: string) {
    if (this.sprites.some((entry) => entry.url === url)) return
    void Assets.unload(url).catch(() => undefined)
  }
}
