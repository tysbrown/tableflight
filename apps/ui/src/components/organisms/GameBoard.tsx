import { useEffect, useRef } from 'react'
import tw from 'twin.macro'
import type { TokenType } from '~common'
import { ZoomMenu } from '@/molecules'
import { useBoard, useExecuteOnKeyHold, useExecuteOnKeyPress } from '@/hooks'
import type { TokenKind } from '@/contexts'

/**
 * The game board: a canvas driven by the headless wasm engine
 * (libs/board-engine) and rendered by PixiJS (src/board/PixiStage). React
 * owns a host element the stage injects its canvas into (the stage owns the
 * canvas because destroying a renderer kills the canvas's WebGL context);
 * the engine owns all board state and interactions; the stage owns the
 * frame loop and drawing.
 */
const GameBoard = () => {
  const {
    engine,
    attachBoard,
    detachBoard,
    resizeViewport,
    dropAsset,
    dropToken,
  } = useBoard()

  const sectionRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    void attachBoard(host)
    return detachBoard
  }, [attachBoard, detachBoard])

  // Forward sizing and input events to the engine (they bubble up from the
  // stage's canvas to the host element).
  useEffect(() => {
    const section = sectionRef.current
    const canvas = hostRef.current
    if (!engine || !section || !canvas) return undefined

    const resize = () =>
      resizeViewport(section.clientWidth, section.clientHeight)
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(section)

    const positionOf = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId)
      const { x, y } = positionOf(event)
      engine.pointerDown(x, y, event.button)
    }
    const onPointerMove = (event: PointerEvent) => {
      const { x, y } = positionOf(event)
      engine.pointerMove(x, y)
    }
    const onPointerUp = (event: PointerEvent) => {
      const { x, y } = positionOf(event)
      engine.pointerUp(x, y)
    }
    const onPointerLeave = () => engine.pointerLeave()
    // A cancelled gesture (touch takeover, OS interrupt) sends no pointerup.
    const onPointerCancel = () => engine.pointerLeave()

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const { x, y } = positionOf(event)
      const zooming = event.ctrlKey || event.metaKey
      engine.wheel(event.deltaX, event.deltaY, zooming, x, y)
    }

    // Tokens and assets both arrive via drag-and-drop; the payload shape
    // says which is which.
    const onDragOver = (event: DragEvent) => event.preventDefault()
    const onDrop = (event: DragEvent) => {
      event.preventDefault()
      const data = event.dataTransfer?.getData('application/json')
      if (!data) return

      // Anything can be dragged in, so validate before trusting the payload.
      let payload: {
        token?: Partial<TokenType>
        asset?: { url?: unknown; width?: unknown; height?: unknown }
      }
      try {
        payload = JSON.parse(data)
      } catch {
        return
      }
      const { x, y } = positionOf(event)

      const size = (value: unknown): value is number =>
        typeof value === 'number' && Number.isFinite(value) && value > 0
      const { asset, token } = payload

      if (
        typeof asset?.url === 'string' &&
        size(asset.width) &&
        size(asset.height)
      ) {
        dropAsset(x, y, {
          url: asset.url,
          width: asset.width,
          height: asset.height,
        })
      } else if (token?.type) {
        dropToken(x, y, token.type as TokenKind)
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('dragover', onDragOver)
    canvas.addEventListener('drop', onDrop)

    return () => {
      resizeObserver.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dragover', onDragOver)
      canvas.removeEventListener('drop', onDrop)
    }
  }, [engine, dropAsset, dropToken, resizeViewport])

  // Keep the browser from zooming the page on ctrl/cmd + wheel.
  useEffect(() => {
    const preventBrowserZoom = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault()
    }
    window.addEventListener('wheel', preventBrowserZoom, { passive: false })
    return () => window.removeEventListener('wheel', preventBrowserZoom)
  }, [])

  useExecuteOnKeyPress('Escape', () => engine?.escape())
  useExecuteOnKeyHold(
    'Shift',
    () => engine?.setHoverEnabled(false),
    () => engine?.setHoverEnabled(true),
  )

  // Delete/Backspace remove the selected asset, unless a form field is focused.
  const deleteSelectedAsset = () => {
    const focused = document.activeElement?.tagName
    if (focused === 'INPUT' || focused === 'TEXTAREA') return
    engine?.deleteSelected()
  }
  useExecuteOnKeyPress('Delete', deleteSelectedAsset)
  useExecuteOnKeyPress('Backspace', deleteSelectedAsset)

  return (
    <section
      data-testid="game-board-section"
      ref={sectionRef}
      css={[tw`relative w-full h-screen overflow-hidden`]}
    >
      <div
        data-testid="game-board-host"
        ref={hostRef}
        css={[tw`absolute inset-0`]}
      />
      <ZoomMenu />
    </section>
  )
}

export default GameBoard
