import { useEffect, useRef, useState } from "react"
import tw from "twin.macro"
import { ZoomMenu } from "@/molecules"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"

type PanZoomContainerProps = {
  image: HTMLImageElement | null
  backgroundImage: string | null
  children: React.ReactNode
}

/**
 * Container with custom panning and zooming functionality.
 */
const PanZoomContainer = ({
  image,
  backgroundImage,
  children,
}: PanZoomContainerProps) => {
  const { state, dispatch } = useGridState()
  const { zoomLevel } = state as GridState

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const lastPosition = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)

  const gridSectionRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const { current: gridSection } = gridSectionRef
  const { current: gridContainer } = gridContainerRef

  const viewportWidth = gridSection?.offsetWidth || 0
  const viewportHeight = gridSection?.offsetHeight || 0

  const gridWidth = gridContainer?.offsetWidth || 0
  const gridHeight = gridContainer?.offsetHeight || 0

  const originalWidth = image?.naturalWidth || gridWidth || 0
  const originalHeight = image?.naturalHeight || gridHeight || 0

  const effectiveWidth = originalWidth * zoomLevel
  const effectiveHeight = originalHeight * zoomLevel

  const updatePosition = (
    dx: number,
    dy: number,
    isInverted: boolean = false,
  ) => {
    const shiftX = (effectiveWidth - originalWidth) / 2
    const shiftY = (effectiveHeight - originalHeight) / 2

    const xPos = isInverted
      ? position.x + dx - shiftX
      : position.x - dx - shiftX
    const yPos = isInverted
      ? position.y + dy - shiftY
      : position.y - dy - shiftY

    const shouldCenterHorizontally = effectiveWidth <= viewportWidth
    const shouldCenterVertically = effectiveHeight <= viewportHeight

    const newX = shouldCenterHorizontally
      ? (viewportWidth - effectiveWidth) / 2 + shiftX
      : Math.max(Math.min(xPos, 0), viewportWidth - effectiveWidth) + shiftX

    const newY = shouldCenterVertically
      ? (viewportHeight - effectiveHeight) / 2 + shiftY
      : Math.max(Math.min(yPos, 0), viewportHeight - effectiveHeight) + shiftY

    setPosition({ x: newX, y: newY })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return

    const isOnGrid = (e.target as HTMLElement).dataset.isgrid === "true"

    if (!isOnGrid) return

    dragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return

    const dx = e.clientX - lastPosition.current.x
    const dy = e.clientY - lastPosition.current.y

    updatePosition(dx, dy, true)
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    dragging.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!gridSection || !gridContainer) return

    const { ctrlKey, metaKey, deltaX, deltaY } = e
    const isZooming = ctrlKey || metaKey

    if (isZooming) handleZoom(deltaY)
    else handlePanning(deltaX, deltaY)
  }

  const handleZoom = (deltaY: number) => {
    const zoomDelta = -deltaY * 0.001
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel + zoomDelta))

    dispatch({ type: "SET_ZOOM_LEVEL", zoomLevel: newZoom })
  }

  const handlePanning = (deltaX: number, deltaY: number) => {
    updatePosition(deltaX, deltaY)
  }

  useEffect(() => {
    updatePosition(0, 0)
  }, [zoomLevel])

  useEffect(() => {
    const preventDefaultZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }

    window.addEventListener("wheel", preventDefaultZoom, { passive: false })

    return () => {
      window.removeEventListener("wheel", preventDefaultZoom)
    }
  }, [])

  return (
    <section
      ref={gridSectionRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      css={[tw`relative w-full h-screen overflow-hidden`]}
    >
      <div
        ref={gridContainerRef}
        css={[
          tw`w-fit origin-center`,
          `transform: translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
          !backgroundImage && tw`w-screen bg-white`,
          !backgroundImage && `height: calc(100vh + 500px)`,
        ]}
      >
        {children}
      </div>
      <ZoomMenu
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        originalWidth={originalWidth}
        originalHeight={originalHeight}
      />
    </section>
  )
}

export default PanZoomContainer
