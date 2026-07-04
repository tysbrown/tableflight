import { Graphics } from 'pixi.js'
import {
  HANDLE_SCREEN_RADIUS,
  LINE_COLOR,
  LINE_FLAG_HOVERED,
  LINE_FLAG_IN_PROGRESS,
  LINE_FLAG_STRAIGHT_HINT,
  LINE_HOVER_COLOR,
  LINE_STRAIGHT_HINT_COLOR,
  LINE_STRIDE,
} from '../constants'

/**
 * Drawn lines, including the hover highlight, endpoint handles, and the
 * in-progress line's straight-hint color — all derived from the engine's
 * lines buffer flags.
 */
export class DrawingsLayer {
  readonly graphics = new Graphics()

  update(lines: Float32Array, zoom: number) {
    const at = (i: number) => lines[i] ?? 0
    const drawing = this.graphics
    drawing.clear()

    for (let base = 0; base + LINE_STRIDE <= lines.length; base += LINE_STRIDE) {
      const flags = at(base + 5)
      const hovered = (flags & LINE_FLAG_HOVERED) !== 0
      const straightHint =
        (flags & LINE_FLAG_IN_PROGRESS) !== 0 &&
        (flags & LINE_FLAG_STRAIGHT_HINT) !== 0

      const color = hovered
        ? LINE_HOVER_COLOR
        : straightHint
          ? LINE_STRAIGHT_HINT_COLOR
          : LINE_COLOR

      drawing
        .moveTo(at(base), at(base + 1))
        .lineTo(at(base + 2), at(base + 3))
        .stroke({ width: at(base + 4), color })

      if (hovered) {
        // Endpoint handles at a constant on-screen size.
        const radius = HANDLE_SCREEN_RADIUS / zoom
        drawing.circle(at(base), at(base + 1), radius).fill(LINE_HOVER_COLOR)
        drawing
          .circle(at(base + 2), at(base + 3), radius)
          .fill(LINE_HOVER_COLOR)
      }
    }
  }
}
