import { Assets, Container, Sprite, Texture } from 'pixi.js'
import { MAP_PLACEHOLDER_TINT } from '../constants'

export type MapData = {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * One sprite per placed map image. Textures load asynchronously — a gray
 * placeholder holds the map's footprint until then — and are released from
 * the Assets cache when the last map using them goes away (map URLs are
 * multi-megabyte data URLs today, so leaking them adds up fast).
 */
export class MapsLayer {
  readonly container = new Container()
  private entries = new Map<string, { sprite: Sprite; url: string }>()

  /** Sync sprites with the engine's map list (on structure change). */
  sync(maps: MapData[]) {
    const seen = new Set<string>()

    for (const map of maps) {
      seen.add(map.id)
      let entry = this.entries.get(map.id)
      if (!entry) {
        const sprite = new Sprite(Texture.WHITE)
        sprite.tint = MAP_PLACEHOLDER_TINT
        sprite.cullable = true
        entry = { sprite, url: map.url }
        this.entries.set(map.id, entry)
        this.container.addChild(sprite)

        void Assets.load<Texture>(map.url)
          .then((texture) => {
            if (!sprite.destroyed) {
              sprite.texture = texture
              sprite.tint = 0xffffff
            }
          })
          .catch((error: unknown) => {
            // The placeholder stays; the board remains usable.
            console.error('Failed to load a map image:', error)
          })
      }
      entry.sprite.position.set(map.x, map.y)
      entry.sprite.setSize(map.width, map.height)
    }

    for (const [id, entry] of this.entries) {
      if (seen.has(id)) continue
      entry.sprite.destroy()
      this.entries.delete(id)
      this.unloadIfUnused(entry.url)
    }
  }

  /** Release all textures (stage teardown; sprites die with the app). */
  destroy() {
    const urls = new Set(
      [...this.entries.values()].map((entry) => entry.url),
    )
    this.entries.clear()
    for (const url of urls) {
      void Assets.unload(url).catch(() => undefined)
    }
  }

  /** Two maps can share one image; only unload when the last user is gone. */
  private unloadIfUnused(url: string) {
    for (const entry of this.entries.values()) {
      if (entry.url === url) return
    }
    void Assets.unload(url).catch(() => undefined)
  }
}
