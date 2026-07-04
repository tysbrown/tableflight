import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Assets, type Texture } from 'pixi.js'
import init, { Engine } from '~board-engine'
import { PixiStage } from '../board/PixiStage'

export type BoardMode = 'pan' | 'draw'
export type TokenKind = 'player' | 'enemy' | 'npc' | 'item'
export type BoardMap = { id: string; url: string }

export type BoardContextType = {
  /** The wasm board engine. Null until a board host is attached. */
  engine: Engine | null
  attachBoard: (host: HTMLElement) => Promise<void>
  detachBoard: () => void
  /** Resize both the engine's viewport and the renderer (CSS pixels). */
  resizeViewport: (width: number, height: number) => void

  mode: BoardMode
  setMode: (mode: BoardMode) => void
  cellSize: number
  setCellSize: (cellSize: number) => void
  zoomLevel: number
  setZoomLevel: (zoom: number) => void
  zoomToFit: () => void
  /** Map images placed on the board. */
  maps: BoardMap[]
  addMap: (dataUrl: string) => Promise<void>
  removeMap: (id: string) => void
  dropToken: (x: number, y: number, kind: TokenKind) => void
  loadSnapshot: (json: string) => void

  gameSessionId: string | null
  setGameSessionId: (gameSessionId: string) => void
}

export const BoardContext = createContext<BoardContextType | null>(null)

/**
 * The wasm module only needs to be instantiated once per page. A failed
 * fetch is not cached, so a later attach can retry.
 */
let wasmReady: Promise<unknown> | null = null
const initWasm = () =>
  (wasmReady ??= init().catch((error: unknown) => {
    wasmReady = null
    throw error
  }))

/**
 * Owns the wasm board engine (headless: state + interactions) and its GPU
 * renderer (PixiStage), and mirrors the few engine values that React
 * components render (mode, cell size, zoom, placed maps). All board content
 * lives inside the engine; components mutate it through the functions
 * exposed here.
 */
export const BoardProvider = ({ children }: { children: React.ReactNode }) => {
  const [engine, setEngine] = useState<Engine | null>(null)
  const engineRef = useRef<Engine | null>(null)
  const stageRef = useRef<PixiStage | null>(null)
  /** Serializes attach/detach so StrictMode remounts can't interleave. */
  const attachSerial = useRef<Promise<unknown>>(Promise.resolve())

  const [mode, setModeState] = useState<BoardMode>('pan')
  const [cellSize, setCellSizeState] = useState(50)
  const [zoomLevel, setZoomLevelState] = useState(1)
  const [maps, setMaps] = useState<BoardMap[]>([])
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)

  const mirrorMaps = useCallback((fromEngine: Engine) => {
    const placed = JSON.parse(fromEngine.mapsJson()) as BoardMap[]
    setMaps(placed.map(({ id, url }) => ({ id, url })))
  }, [])

  const attachBoard = useCallback((host: HTMLElement) => {
    const attach = attachSerial.current.then(async () => {
      stageRef.current?.destroy()
      engineRef.current?.free()
      stageRef.current = null
      engineRef.current = null

      await initWasm()
      const attached = new Engine()
      const stage = await PixiStage.create(attached, host, {
        // Quantize to the displayed precision so a continuous pinch-zoom
        // doesn't re-render every consumer on every animation frame.
        onZoomChange: (zoom) => {
          const next = Math.round(zoom * 100) / 100
          setZoomLevelState((prev) => (prev === next ? prev : next))
        },
      })

      engineRef.current = attached
      stageRef.current = stage
      setEngine(attached)
    })
    attachSerial.current = attach.catch(() => undefined)
    return attach
  }, [])

  const detachBoard = useCallback(() => {
    attachSerial.current = attachSerial.current.then(() => {
      stageRef.current?.destroy()
      engineRef.current?.free()
      stageRef.current = null
      engineRef.current = null
      setEngine(null)
    })
  }, [])

  const resizeViewport = useCallback((width: number, height: number) => {
    engineRef.current?.setViewport(width, height)
    stageRef.current?.resize(width, height)
  }, [])

  const setMode = useCallback(
    (nextMode: BoardMode) => {
      engine?.setMode(nextMode)
      setModeState(nextMode)
    },
    [engine],
  )

  const setCellSize = useCallback(
    (nextCellSize: number) => {
      engine?.setCellSize(nextCellSize)
      setCellSizeState(nextCellSize)
    },
    [engine],
  )

  const setZoomLevel = useCallback(
    (zoom: number) => {
      if (!engine) return
      engine.setZoom(zoom)
      setZoomLevelState(engine.zoom())
    },
    [engine],
  )

  const zoomToFit = useCallback(() => {
    if (!engine) return
    engine.zoomToFit()
    setZoomLevelState(engine.zoom())
  }, [engine])

  const addMap = useCallback(
    async (dataUrl: string) => {
      if (!engine) return
      try {
        // The renderer measures the image; the engine just needs dimensions.
        const texture = await Assets.load<Texture>(dataUrl)
        engine.addMap(dataUrl, texture.width, texture.height)
        mirrorMaps(engine)
      } catch (error) {
        console.error('Failed to add the map image:', error)
      }
    },
    [engine, mirrorMaps],
  )

  const removeMap = useCallback(
    (id: string) => {
      if (!engine) return
      engine.removeMap(id)
      mirrorMaps(engine)
    },
    [engine, mirrorMaps],
  )

  const dropToken = useCallback(
    (x: number, y: number, kind: TokenKind) => {
      engine?.dropToken(x, y, crypto.randomUUID(), kind)
    },
    [engine],
  )

  const loadSnapshot = useCallback(
    (json: string) => {
      if (!engine) return
      engine.loadSnapshot(json)
      mirrorMaps(engine)
      setCellSizeState(engine.cellSize())
      setZoomLevelState(engine.zoom())
      setModeState(engine.mode() as BoardMode)
    },
    [engine, mirrorMaps],
  )

  const value = useMemo(
    () => ({
      engine,
      attachBoard,
      detachBoard,
      resizeViewport,
      mode,
      setMode,
      cellSize,
      setCellSize,
      zoomLevel,
      setZoomLevel,
      zoomToFit,
      maps,
      addMap,
      removeMap,
      dropToken,
      loadSnapshot,
      gameSessionId,
      setGameSessionId,
    }),
    [
      engine,
      attachBoard,
      detachBoard,
      resizeViewport,
      mode,
      setMode,
      cellSize,
      setCellSize,
      zoomLevel,
      setZoomLevel,
      zoomToFit,
      maps,
      addMap,
      removeMap,
      dropToken,
      loadSnapshot,
      gameSessionId,
    ],
  )

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}
