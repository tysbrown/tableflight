import { Container, Graphics } from 'pixi.js'
import {
  TOKEN_COLORS,
  TOKEN_FLAG_DRAGGING,
  TOKEN_STRIDE,
} from '../constants'

/**
 * One circle per token. The circle list follows the engine's token list
 * (rebuild on structure change); positions, colors, and the drag ghost come
 * from the tokens buffer each frame.
 */
export class TokensLayer {
  readonly container = new Container()
  private circles: Graphics[] = []
  private kinds: number[] = []
  private cellSize = 0

  /** Match the circle count to the token count (on structure change). */
  rebuild(tokenCount: number) {
    while (this.circles.length > tokenCount) {
      this.circles.pop()?.destroy()
    }
    while (this.circles.length < tokenCount) {
      const circle = new Graphics()
      this.circles.push(circle)
      this.container.addChild(circle)
    }
    this.kinds = []
  }

  update(tokens: Float32Array, cellSize: number) {
    const at = (i: number) => tokens[i] ?? 0
    if (cellSize !== this.cellSize) this.kinds = []

    for (let index = 0; index < this.circles.length; index++) {
      const circle = this.circles[index]
      if (!circle) break
      const base = index * TOKEN_STRIDE
      const kind = at(base + 2)

      if (this.kinds[index] !== kind) {
        circle
          .clear()
          .circle(0, 0, cellSize * 0.4)
          .fill(TOKEN_COLORS[kind] ?? 0x6b7280)
        this.kinds[index] = kind
      }

      circle.position.set(at(base), at(base + 1))
      circle.alpha = (at(base + 3) & TOKEN_FLAG_DRAGGING) !== 0 ? 0.7 : 1
    }
    this.cellSize = cellSize
  }
}
