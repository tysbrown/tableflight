/**
 * Entry for board-harness.html (dev/test only): boots the headless wasm
 * engine + PixiStage against a bare host element and exposes hooks for the
 * playwright render/perf specs (apps/ui-e2e/src/board-render.test.ts).
 */
import init, { Engine } from '~board-engine'
import { PixiStage } from './PixiStage'

const VIEWPORT = { width: 1000, height: 700 }

/** A seeded v2 snapshot: a token/line field spiraling out from the origin. */
const seededSnapshot = (tokenCount: number, lineCount: number) => {
  const kinds = ['player', 'enemy', 'npc', 'item']
  const tokens = Array.from({ length: tokenCount }, (_, i) => ({
    id: `seed-token-${i}`,
    kind: kinds[i % kinds.length],
    col: (i % 25) * 2,
    row: Math.floor(i / 25) * 2,
  }))
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const angle = i * 2.39996 // golden angle: spread lines evenly
    const radius = 20 + i * 0.8
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return {
      id: `seed-line-${i}`,
      start: { x, y },
      end: { x: x + 40 * Math.cos(angle), y: y + 40 * Math.sin(angle) },
      width: 2,
    }
  })

  return JSON.stringify({
    version: 2,
    cellSize: 50,
    maps: [],
    tokens,
    lines,
    nextId: tokenCount + lineCount + 1,
    camera: { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2, zoom: 1 },
  })
}

const boot = async () => {
  await init()
  const host = document.getElementById('board') as HTMLElement

  const create = async () => {
    const engine = new Engine()
    engine.setViewport(VIEWPORT.width, VIEWPORT.height)
    const stage = await PixiStage.create(engine, host)
    return { engine, stage }
  }

  let board = await create()

  Object.assign(window, {
    __board: {
      get engine() {
        return board.engine
      },
      get stage() {
        return board.stage
      },
      seed: (tokenCount: number, lineCount: number) =>
        board.engine.loadSnapshot(seededSnapshot(tokenCount, lineCount)),
      /**
       * Replays what BoardProvider does on a React StrictMode remount:
       * destroy the stage and engine, then re-create both on the same host.
       */
      remount: async () => {
        board.stage.destroy()
        board.engine.free()
        board = await create()
      },
    },
  })
}

void boot()
