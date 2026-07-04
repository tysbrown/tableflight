import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Drives the real wasm board engine in the browser via the static harness
 * page (see ./harness/index.html) — no app, API, or auth in the way.
 */
const HARNESS_URL = 'http://localhost:4301/apps/ui-e2e/src/harness/index.html'

const v1Snapshot = readFileSync(
  join(__dirname, 'harness/fixtures/v1-snapshot.json'),
  'utf-8',
)

/** The engine as exposed on window by the harness (untyped surface). */
type HarnessWindow = { engine: any; engineReady: Promise<unknown> }

const snapshot = (page: Page) =>
  page.evaluate(() =>
    JSON.parse((window as unknown as HarnessWindow).engine.snapshot()),
  )

test.beforeEach(async ({ page }) => {
  await page.goto(HARNESS_URL)
  await page.waitForFunction(
    () => (window as unknown as HarnessWindow).engine !== undefined,
  )
})

test('the world is open: panning far beyond the old board bounds works', async ({
  page,
}) => {
  await page.evaluate(() => {
    const { engine } = window as unknown as HarnessWindow
    // Wheel-pan 50,000px right and 40,000px down — far outside the old
    // 3000x3000 bounded board.
    engine.wheel(50_000, 40_000, false, 400, 300)
  })

  const { camera } = await snapshot(page)
  expect(camera).toMatchObject({ x: -50_000, y: -40_000, zoom: 1 })
})

test('the camera center clamps at the world extent, not at a board edge', async ({
  page,
}) => {
  await page.evaluate(() => {
    const { engine } = window as unknown as HarnessWindow
    engine.wheel(1e9, 1e9, false, 400, 300) // absurdly far
  })

  const { camera } = await snapshot(page)
  // Camera center = (viewportCenter - camera) / zoom, clamped to ±131072.
  expect((400 - camera.x) / camera.zoom).toBe(131_072)
  expect((300 - camera.y) / camera.zoom).toBe(131_072)
})

test('tokens can be dropped very far from the origin', async ({ page }) => {
  await page.evaluate(() => {
    const { engine } = window as unknown as HarnessWindow
    engine.wheel(99_600, 99_700, false, 400, 300) // world (100000, 100000) lands at screen (400, 300)
    engine.dropToken(400, 300, 'far-token', 'player')
  })

  const { tokens } = await snapshot(page)
  expect(tokens).toEqual([
    { id: 'far-token', kind: 'player', col: 2000, row: 2000 },
  ])
})

test('a v1 snapshot loads, migrates to v2, and saves back as v2', async ({
  page,
}) => {
  const migrated = await page.evaluate((v1) => {
    const { engine } = window as unknown as HarnessWindow
    engine.loadSnapshot(v1)
    return JSON.parse(engine.snapshot())
  }, v1Snapshot)

  expect(migrated.version).toBe(2)
  expect(migrated.background).toBeUndefined()

  // The v1 background became the first placeable map, at the origin.
  expect(migrated.maps).toHaveLength(1)
  expect(migrated.maps[0]).toMatchObject({
    x: 0,
    y: 0,
    width: 2000,
    height: 1500,
  })

  // Content and view survive the migration.
  expect(migrated.tokens).toHaveLength(2)
  expect(migrated.lines).toHaveLength(1)
  expect(migrated.cellSize).toBe(40)
  expect(migrated.camera).toMatchObject({ zoom: 1.25 })
})
