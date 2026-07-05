import { Graphics } from 'pixi.js'
import {
  SELECTION_COLOR,
  SELECTION_HANDLE_FILL,
  SELECTION_HANDLE_SCREEN_SIZE,
  SELECTION_STROKE_SCREEN_WIDTH,
} from '../constants'

/**
 * Selection chrome for the selected placed asset: an outline plus four
 * corner resize handles, all at constant on-screen size. Geometry comes
 * from the engine's selection buffer (`[x, y, width, height]`, empty when
 * nothing is selected).
 */
export class SelectionLayer {
  readonly graphics = new Graphics()

  update(selection: Float32Array, zoom: number) {
    const chrome = this.graphics
    chrome.clear()
    if (selection.length < 4) return

    const [x = 0, y = 0, width = 0, height = 0] = selection
    chrome.rect(x, y, width, height).stroke({
      width: SELECTION_STROKE_SCREEN_WIDTH / zoom,
      color: SELECTION_COLOR,
    })

    const size = SELECTION_HANDLE_SCREEN_SIZE / zoom
    const corners = [
      [x, y],
      [x + width, y],
      [x, y + height],
      [x + width, y + height],
    ] as const
    for (const [cornerX, cornerY] of corners) {
      chrome
        .rect(cornerX - size / 2, cornerY - size / 2, size, size)
        .fill(SELECTION_HANDLE_FILL)
        .stroke({ width: 1 / zoom, color: SELECTION_COLOR })
    }
  }
}
