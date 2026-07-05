import type { Engine } from '~board-engine'

const THICKNESS = 6
const INSET = 3
/** Real scrollbars never shrink to nothing, however far you pan. */
const MIN_THUMB_PX = 24
const HIDE_DELAY_MS = 800
/** At (or above) this fraction the axis is fully in view — no bar. */
const FULL_TRACK = 0.999

type Axis = 'h' | 'v'

/**
 * Overscroll scrollbars: thin thumbs along the bottom/right
 * edges that appear when the view extends past the board's content and
 * shrink the further away you pan (the engine computes the geometry — the
 * scroll range is content ∪ viewport). They fade out when the camera rests,
 * and dragging a thumb pans the board.
 *
 * Plain DOM on top of the canvas: screen-space chrome, driven imperatively
 * from the stage's frame loop, so no React re-renders during panning.
 */
export class Scrollbars {
  private thumbs: Record<Axis, HTMLDivElement> = {
    h: document.createElement('div'),
    v: document.createElement('div'),
  }
  private metrics: Record<Axis, { start: number; size: number }> = {
    h: { start: 0, size: 1 },
    v: { start: 0, size: 1 },
  }
  private viewport = { width: 0, height: 0 }
  private hideTimer: ReturnType<typeof setTimeout> | null = null
  private drag: { axis: Axis; last: number } | null = null

  constructor(
    private engine: Engine,
    private host: HTMLElement,
  ) {
    // Thumbs are positioned against the host.
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative'
    }

    for (const axis of ['h', 'v'] as const) {
      const thumb = this.thumbs[axis]
      thumb.dataset['testid'] = `board-scrollbar-${axis}`
      Object.assign(thumb.style, {
        position: 'absolute',
        borderRadius: '9999px',
        background: 'rgba(0, 0, 0, 0.35)',
        opacity: '0',
        transition: 'opacity 0.2s',
        zIndex: '10',
        touchAction: 'none',
      } satisfies Partial<CSSStyleDeclaration>)
      if (axis === 'h') {
        thumb.style.bottom = `${INSET}px`
        thumb.style.height = `${THICKNESS}px`
      } else {
        thumb.style.right = `${INSET}px`
        thumb.style.width = `${THICKNESS}px`
      }

      thumb.addEventListener('pointerdown', (event) => {
        // Keep the board's own pan/draw handlers out of thumb drags.
        event.stopPropagation()
        event.preventDefault()
        thumb.setPointerCapture(event.pointerId)
        this.drag = {
          axis,
          last: axis === 'h' ? event.clientX : event.clientY,
        }
      })
      thumb.addEventListener('pointermove', (event) => {
        event.stopPropagation()
        if (this.drag?.axis !== axis) return
        const position = axis === 'h' ? event.clientX : event.clientY
        this.dragBy(axis, position - this.drag.last)
        this.drag.last = position
      })
      const endDrag = (event: PointerEvent) => {
        event.stopPropagation()
        this.drag = null
        this.scheduleHide()
      }
      thumb.addEventListener('pointerup', endDrag)
      thumb.addEventListener('pointercancel', endDrag)

      host.appendChild(thumb)
    }
  }

  /** Called from the stage's frame loop whenever anything changed. */
  update(viewportWidth: number, viewportHeight: number) {
    this.viewport = { width: viewportWidth, height: viewportHeight }
    const [hStart = 0, hSize = 1, vStart = 0, vSize = 1] =
      this.engine.scrollbars()

    const hChanged = this.apply('h', hStart, hSize, viewportWidth)
    const vChanged = this.apply('v', vStart, vSize, viewportHeight)

    // Only geometry changes (pan/zoom/content moves) wake the bars up.
    if (hChanged || vChanged) this.show()
  }

  destroy() {
    if (this.hideTimer) clearTimeout(this.hideTimer)
    this.thumbs.h.remove()
    this.thumbs.v.remove()
  }

  /** Lay out one thumb; returns whether its geometry changed. */
  private apply(
    axis: Axis,
    start: number,
    size: number,
    viewPx: number,
  ): boolean {
    const previous = this.metrics[axis]
    const changed = previous.start !== start || previous.size !== size
    this.metrics[axis] = { start, size }

    const thumb = this.thumbs[axis]
    if (size >= FULL_TRACK) {
      thumb.style.opacity = '0'
      return changed
    }

    // Leave the corner free where the two bars would meet.
    const track = viewPx - 2 * INSET - THICKNESS
    const length = Math.max(size * track, MIN_THUMB_PX)
    // With the minimum-size clamp, position maps travel-to-travel.
    const progress = size < 1 ? start / (1 - size) : 0
    const offset = INSET + progress * (track - length)

    if (axis === 'h') {
      thumb.style.left = `${offset}px`
      thumb.style.width = `${length}px`
    } else {
      thumb.style.top = `${offset}px`
      thumb.style.height = `${length}px`
    }
    return changed
  }

  private dragBy(axis: Axis, deltaPx: number) {
    const { size } = this.metrics[axis]
    if (size >= FULL_TRACK || deltaPx === 0) return

    const viewPx = axis === 'h' ? this.viewport.width : this.viewport.height
    // size = viewport / range → the full scroll range in screen pixels.
    const rangePx = viewPx / size
    const track = viewPx - 2 * INSET - THICKNESS
    // Moving the thumb across the track moves the view across the range;
    // the content moves the opposite way.
    const pan = -deltaPx * (rangePx / track)
    if (axis === 'h') this.engine.panBy(pan, 0)
    else this.engine.panBy(0, pan)
  }

  private show() {
    for (const axis of ['h', 'v'] as const) {
      if (this.metrics[axis].size < FULL_TRACK) {
        this.thumbs[axis].style.opacity = '1'
      }
    }
    this.scheduleHide()
  }

  private scheduleHide() {
    if (this.hideTimer) clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => {
      if (this.drag) return // stay visible while a thumb is being dragged
      this.thumbs.h.style.opacity = '0'
      this.thumbs.v.style.opacity = '0'
    }, HIDE_DELAY_MS)
  }
}
