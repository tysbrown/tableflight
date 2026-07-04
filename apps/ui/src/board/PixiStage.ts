import { Application, Container } from 'pixi.js'
import type { Engine } from '~board-engine'
import { WORLD_FILL } from './constants'
import { DrawingsLayer } from './layers/DrawingsLayer'
import { GridLayer } from './layers/GridLayer'
import { MapsLayer, type MapData } from './layers/MapsLayer'
import { TokensLayer } from './layers/TokensLayer'

export type PixiStageOptions = {
  /** Called when the engine's camera zoom changes (wheel/pinch zooming). */
  onZoomChange?: (zoom: number) => void
}

/**
 * Long frame gaps (hidden tab, debugger pause) must not turn into one giant
 * engine tick — edge auto-pan would teleport the camera.
 */
const MAX_TICK_MS = 100

/**
 * The GPU renderer for the board. The engine is headless and owns all state
 * and interactions; this stage runs the frame loop, pulls the engine's
 * typed-array buffers, and keeps a Pixi scene in sync:
 *
 * - `structureRevision` moved → rebuild display objects (map/token lists)
 * - `frameRevision` moved     → update content from buffers (positions, hover)
 * - `cameraRevision` moved    → move the world container, rebuild the grid
 *
 * Nothing changed → nothing is drawn, preserving the engine's dirty-flag
 * philosophy (battery-friendly idle).
 *
 * The stage creates and owns its `<canvas>` inside the given host element:
 * destroying a Pixi renderer permanently loses the canvas's WebGL context,
 * so the canvas must die with the stage (a fresh attach gets a fresh canvas
 * — this is what makes StrictMode's mount/unmount/mount cycle safe).
 */
export class PixiStage {
  private app = new Application()
  private canvas = document.createElement('canvas')
  private world = new Container()
  private maps = new MapsLayer()
  private grid = new GridLayer()
  private drawings = new DrawingsLayer()
  private tokens = new TokensLayer()

  private frameId = 0
  private lastTime = 0
  private lastStructure = -1
  private lastFrame = -1
  private lastCamera = -1
  private lastZoom = -1
  private lastCursor = ''

  private constructor(
    private engine: Engine,
    private options: PixiStageOptions,
  ) {}

  static async create(
    engine: Engine,
    host: HTMLElement,
    options: PixiStageOptions = {},
  ): Promise<PixiStage> {
    const stage = new PixiStage(engine, options)

    await stage.app.init({
      canvas: stage.canvas,
      autoStart: false, // the stage drives rendering itself, only when dirty
      backgroundColor: WORLD_FILL,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    })
    host.appendChild(stage.canvas)

    stage.world.addChild(
      stage.maps.container,
      stage.grid.graphics,
      stage.drawings.graphics,
      stage.tokens.container,
    )
    stage.app.stage.addChild(stage.world)

    stage.lastTime = performance.now()
    stage.frameId = requestAnimationFrame(stage.frame)
    return stage
  }

  /** Resize the drawing surface (CSS pixels). */
  resize(width: number, height: number) {
    // The window may have moved to a display with a different pixel density.
    const dpr = window.devicePixelRatio || 1
    if (this.app.renderer.resolution !== dpr) {
      this.app.renderer.resolution = dpr
    }
    this.app.renderer.resize(width, height)
    this.lastCamera = -1 // the visible world rect changed — redraw
  }

  destroy() {
    cancelAnimationFrame(this.frameId)
    this.app.destroy(undefined, { children: true })
    this.maps.destroy()
    this.canvas.remove()
  }

  private frame = (now: number) => {
    this.frameId = requestAnimationFrame(this.frame)

    const { engine } = this
    engine.tick(Math.min(now - this.lastTime, MAX_TICK_MS))
    this.lastTime = now

    // The cursor can change without any revision moving (e.g. sliding along
    // a hovered line onto its handle), so it updates every frame.
    const cursor = engine.cursorStyle()
    if (cursor !== this.lastCursor) {
      this.canvas.style.cursor = cursor
      this.lastCursor = cursor
    }

    const structure = engine.structureRevision()
    const frame = engine.frameRevision()
    const camera = engine.cameraRevision()
    if (
      structure === this.lastStructure &&
      frame === this.lastFrame &&
      camera === this.lastCamera
    ) {
      return
    }

    if (structure !== this.lastStructure) {
      const maps = JSON.parse(engine.mapsJson()) as MapData[]
      this.maps.sync(maps)
      this.tokens.rebuild((JSON.parse(engine.tokenIdsJson()) as string[]).length)
    }

    const [x = 0, y = 0, zoom = 1] = engine.cameraBuffer()
    if (camera !== this.lastCamera) {
      this.world.position.set(x, y)
      this.world.scale.set(zoom)
      this.options.onZoomChange?.(zoom)
    }

    if (frame !== this.lastFrame || structure !== this.lastStructure) {
      this.tokens.update(engine.tokensBuffer(), engine.cellSize())
    }
    // Handle dots are sized in screen pixels, so drawings also depend on zoom.
    if (
      frame !== this.lastFrame ||
      structure !== this.lastStructure ||
      zoom !== this.lastZoom
    ) {
      this.drawings.update(engine.linesBuffer(), zoom)
      this.lastZoom = zoom
    }

    this.grid.update(
      { x, y, zoom },
      this.app.screen.width,
      this.app.screen.height,
      engine.cellSize(),
    )

    this.lastStructure = structure
    this.lastFrame = frame
    this.lastCamera = camera
    this.app.render()
  }
}
