import { Graphics } from 'pixi.js'
import {
  type CameraView,
  GRID_COLOR,
  GRID_LINE_SCREEN_WIDTH,
  GRID_MIN_ZOOM,
} from '../constants'

/**
 * The infinite grid, drawn only across the visible world rect (snapped
 * outward to cell boundaries, so panning within a cell reuses the geometry).
 * Hidden when zoomed far out, where it would read as noise.
 */
export class GridLayer {
  readonly graphics = new Graphics()
  private lastKey = ''

  update(
    camera: CameraView,
    viewportWidth: number,
    viewportHeight: number,
    cellSize: number,
  ) {
    const { x, y, zoom } = camera

    if (zoom < GRID_MIN_ZOOM) {
      if (this.lastKey !== 'hidden') {
        this.graphics.clear()
        this.lastKey = 'hidden'
      }
      return
    }

    const minX = Math.floor(-x / zoom / cellSize) * cellSize
    const minY = Math.floor(-y / zoom / cellSize) * cellSize
    const maxX = Math.ceil((viewportWidth - x) / zoom / cellSize) * cellSize
    const maxY = Math.ceil((viewportHeight - y) / zoom / cellSize) * cellSize

    const key = `${minX},${minY},${maxX},${maxY},${cellSize},${zoom}`
    if (key === this.lastKey) return
    this.lastKey = key

    const grid = this.graphics
    grid.clear()
    for (let gx = minX; gx <= maxX; gx += cellSize) {
      grid.moveTo(gx, minY).lineTo(gx, maxY)
    }
    for (let gy = minY; gy <= maxY; gy += cellSize) {
      grid.moveTo(minX, gy).lineTo(maxX, gy)
    }
    grid.stroke({ width: GRID_LINE_SCREEN_WIDTH / zoom, color: GRID_COLOR })
  }
}
