import { test, expect, type Page } from '@playwright/test'

/**
 * Drives the full board stack — headless wasm engine + PixiJS renderer —
 * via the Vite-served harness page (apps/ui/board-harness.html).
 */
const HARNESS_URL = 'http://localhost:5173/board-harness.html'

/** The harness surface exposed on window (untyped). */
type HarnessWindow = {
  __board: {
    engine: any
    seed: (t: number, l: number) => void
    remount: () => Promise<void>
  }
}

const TOKEN_STRIDE = 4
const TOKEN_FLAG_DRAGGING = 1

test.beforeEach(async ({ page }) => {
  await page.goto(HARNESS_URL)
  await page.waitForFunction(
    () => (window as unknown as HarnessWindow).__board !== undefined,
  )
})

test('renders a seeded board (smoke screenshot)', async ({ page }) => {
  // Baselines are platform-suffixed and generated on macOS; other platforms
  // rasterize differently and have no committed baseline.
  test.skip(
    process.platform !== 'darwin',
    'screenshot baseline exists for macOS only',
  )
  await page.evaluate(() => {
    const { __board } = window as unknown as HarnessWindow
    __board.seed(20, 100)
  })
  // Two frames so the stage has rendered the seeded content.
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )

  await expect(page.locator('#board')).toHaveScreenshot('seeded-board.png', {
    maxDiffPixelRatio: 0.02,
  })
})

test('survives a destroy/re-create cycle on the same host (StrictMode remount)', async ({
  page,
}) => {
  test.skip(
    process.platform !== 'darwin',
    'screenshot baseline exists for macOS only',
  )
  await page.evaluate(async () => {
    const { __board } = window as unknown as HarnessWindow
    // Destroying a Pixi renderer loses its canvas's WebGL context; the stage
    // must come back rendering on a fresh canvas, not a dead one.
    await __board.remount()
    __board.seed(20, 100)
  })
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )

  // Same baseline as the first-mount test: the remounted board must render
  // identically, which fails if the new stage inherited a lost context.
  await expect(page.locator('#board')).toHaveScreenshot('seeded-board.png', {
    maxDiffPixelRatio: 0.02,
  })
})

test('tokens buffer tracks a drag: ghost follows the cursor, drop snaps to a cell', async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { engine } = (window as unknown as HarnessWindow).__board

    // Camera starts at the origin: screen (525, 375) is world (525, 375) →
    // cell (10, 7), whose center is world (525, 375).
    engine.dropToken(525, 375, 'drag-me', 'enemy')
    const afterDrop = Array.from(engine.tokensBuffer() as Float32Array)

    engine.pointerDown(525, 375, 0)
    engine.pointerMove(650, 480)
    const midDrag = Array.from(engine.tokensBuffer() as Float32Array)

    engine.pointerUp(650, 480)
    const settled = JSON.parse(engine.snapshot())

    return { afterDrop, midDrag, tokens: settled.tokens }
  })

  // stride/kind layout: [x, y, kind, flags], enemy = 1
  expect(result.afterDrop).toEqual([525, 375, 1, 0])

  // Mid-drag: the ghost is at the cursor's world position, flagged.
  expect(result.midDrag.slice(0, TOKEN_STRIDE)).toEqual([
    650,
    480,
    1,
    TOKEN_FLAG_DRAGGING,
  ])

  // Dropped: snapped to cell (13, 9).
  expect(result.tokens).toEqual([
    { id: 'drag-me', kind: 'enemy', col: 13, row: 9 },
  ])
})

/**
 * 2x2 PNG data URL — a deterministic texture for asset specs. Deliberately
 * NOT 1x1: the sprite placeholder is a 1x1 texture, so a 1x1 test image
 * would mask stale-scale bugs when the real texture swaps in.
 */
const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGMQW+wFRAwQCgAbkgQNWsY1fwAAAABJRU5ErkJggg=='

test('dropped asset lands selected; move, resize, deselect, re-select, delete', async ({
  page,
}) => {
  const state = await page.evaluate((url) => {
    const { engine } = (window as unknown as HarnessWindow).__board

    // 200x100 dropped at (500,350) → centered world rect (400,300)
    engine.dropAsset(500, 350, url, 200, 100)
    const dropped = {
      selection: Array.from(engine.selectionBuffer() as Float32Array),
      id: engine.selectedMapId(),
    }

    // drag the body: grab (500,350) → release (560,390)
    engine.pointerDown(500, 350, 0)
    engine.pointerMove(560, 390)
    engine.pointerUp(560, 390)
    const moved = Array.from(engine.selectionBuffer() as Float32Array)

    // resize from the SE corner (now 660,440), NW anchored
    engine.pointerDown(660, 440, 0)
    engine.pointerMove(760, 490)
    engine.pointerUp(760, 490)
    const resized = Array.from(engine.selectionBuffer() as Float32Array)

    engine.pointerDown(50, 50, 0) // click empty space: deselect
    engine.pointerUp(50, 50)
    const deselected = Array.from(engine.selectionBuffer() as Float32Array)

    engine.pointerDown(500, 400, 0) // re-select, then delete
    engine.pointerUp(500, 400)
    const reselected = engine.selectedMapId()
    const deleted = engine.deleteSelected()

    return {
      dropped,
      moved,
      resized,
      deselected,
      reselected,
      deleted,
      maps: JSON.parse(engine.mapsJson()),
    }
  }, PIXEL_PNG)

  expect(state.dropped.selection).toEqual([400, 300, 200, 100])
  expect(state.dropped.id).toBeTruthy()
  expect(state.moved).toEqual([460, 340, 200, 100])
  expect(state.resized).toEqual([460, 340, 300, 150])
  expect(state.deselected).toEqual([])
  expect(state.reselected).toBeTruthy()
  expect(state.deleted).toBe(true)
  expect(state.maps).toEqual([])
})

test('a placed asset renders without further interaction, with selection chrome', async ({
  page,
}) => {
  test.skip(
    process.platform !== 'darwin',
    'screenshot baseline exists for macOS only',
  )
  await page.evaluate((url) => {
    const { engine } = (window as unknown as HarnessWindow).__board
    engine.dropAsset(500, 350, url, 200, 100)
  }, PIXEL_PNG)

  // No input, no camera motion: the texture must appear on its own once
  // loaded (the original "nothing renders until I draw a line" bug).
  await page.waitForTimeout(400)

  await expect(page.locator('#board')).toHaveScreenshot(
    'asset-selected.png',
    { maxDiffPixelRatio: 0.02 },
  )
})

test('loads extension-less asset URLs (like /api/assets/:id)', async ({
  page,
}) => {
  test.skip(
    process.platform !== 'darwin',
    'screenshot baseline exists for macOS only',
  )

  // Serve the 2x2 PNG from an extension-less URL — the shape of /api/assets/:id.
  const pngBytes = Buffer.from(PIXEL_PNG.split(',')[1] ?? '', 'base64')
  await page.route('**/fake-assets/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: pngBytes }),
  )

  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('[Assets]')) warnings.push(message.text())
  })

  await page.evaluate(() => {
    const { engine } = (window as unknown as HarnessWindow).__board
    engine.dropAsset(500, 350, '/fake-assets/2a5857d6-uuid-shaped', 200, 100)
  })
  await page.waitForTimeout(400)

  expect(warnings).toEqual([])
  // Same texture/point/size as the data-URL spec, so it shares that baseline.
  await expect(page.locator('#board')).toHaveScreenshot('asset-selected.png', {
    maxDiffPixelRatio: 0.02,
  })
})

test('overscroll scrollbars appear, shrink with distance, and drag-pan', async ({
  page,
}) => {
  const thumbWidth = () =>
    page.locator('[data-testid="board-scrollbar-h"]').evaluate((el) => ({
      width: el.getBoundingClientRect().width,
      opacity: getComputedStyle(el).opacity,
    }))

  const pan = (dx: number, dy: number) =>
    page.evaluate(
      ([x, y]) => {
        const { engine } = (window as unknown as HarnessWindow).__board
        engine.panBy(x, y)
      },
      [dx, dy],
    )

  // Content in view (token under the camera): no scrollbars.
  await page.evaluate(() => {
    const { engine } = (window as unknown as HarnessWindow).__board
    engine.dropToken(500, 350, 'anchor', 'player')
  })
  await page.waitForTimeout(300) // let any opacity transition settle
  expect((await thumbWidth()).opacity).toBe('0')

  // Pan past the content: the horizontal thumb appears...
  await pan(-3000, 0)
  await page.waitForTimeout(50)
  const near = await thumbWidth()
  expect(parseFloat(near.opacity)).toBeGreaterThan(0) // fading in
  expect(near.width).toBeLessThan(1000)

  // ...and shrinks the further away you pan.
  await pan(-6000, 0)
  await page.waitForTimeout(50)
  const far = await thumbWidth()
  expect(far.width).toBeLessThan(near.width)

  // Dragging the thumb left pans the view back toward the content.
  const cameraX = () =>
    page.evaluate(
      () =>
        JSON.parse(
          (window as unknown as HarnessWindow).__board.engine.snapshot(),
        ).camera.x,
    )
  const before = await cameraX()
  const thumb = page.locator('[data-testid="board-scrollbar-h"]')
  const box = (await thumb.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2)
  await page.mouse.up()
  expect(await cameraX()).toBeGreaterThan(before)

  // Back over the content, the bars hide again.
  await page.evaluate(() => {
    const { engine } = (window as unknown as HarnessWindow).__board
    engine.zoomToFit()
  })
  await page.waitForTimeout(300) // fade-out transition
  expect((await thumbWidth()).opacity).toBe('0')
})

test('pans a heavy board (100 tokens, 5k lines) at 55+ fps', async ({
  page,
}) => {
  await page.evaluate(() => {
    const { __board } = window as unknown as HarnessWindow
    __board.seed(100, 5000)
  })

  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const { engine } = (window as unknown as HarnessWindow).__board
        let frames = 0
        const start = performance.now()
        const spin = () => {
          // Keep the camera moving so every frame really renders.
          engine.wheel(6, 4, false, 500, 350)
          frames++
          const elapsed = performance.now() - start
          if (elapsed < 2000) requestAnimationFrame(spin)
          else resolve((frames * 1000) / elapsed)
        }
        requestAnimationFrame(spin)
      }),
  )

  // CI runners rasterize WebGL in software (SwiftShader); hold them to a
  // lower bar than developer hardware.
  expect(fps).toBeGreaterThanOrEqual(process.env.CI ? 30 : 55)
})
