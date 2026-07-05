import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import init, { Engine } from '~board-engine'
import { PixiStage } from '../board/PixiStage'
import type { DroppedAssetData } from '../hooks/useAssets'

export type BoardMode = 'pan' | 'draw'
export type TokenKind = 'player' | 'enemy' | 'npc' | 'item'

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
  dropAsset: (x: number, y: number, asset: DroppedAssetData) => void
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
 * components render (mode, cell size, zoom). All board content
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
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)

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

  const dropAsset = useCallback(
    (x: number, y: number, asset: DroppedAssetData) => {
      engine?.dropAsset(x, y, asset.url, asset.width, asset.height)
    },
    [engine],
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
      setCellSizeState(engine.cellSize())
      setZoomLevelState(engine.zoom())
      setModeState(engine.mode() as BoardMode)
    },
    [engine],
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
      dropAsset,
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
      dropAsset,
      dropToken,
      loadSnapshot,
      gameSessionId,
    ],
  )

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}
