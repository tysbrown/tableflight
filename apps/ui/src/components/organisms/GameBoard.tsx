import { useEffect, useRef, useState } from "react"
import tw from "twin.macro"
import { clamp } from "@/utils"
import { Canvas, ZoomMenu, Grid } from "@/molecules"
import { useGridState } from "@/hooks/useGridState"
import { type GridState } from "@/contexts"

/**
 * Gridded game board with panning and zooming functionality.
 */
const GameBoard = () => {
  const { state, dispatch } = useGridState()
  const { backgroundImage, zoomLevel } = state as GridState
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const lastPosition = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)

  const gridSectionRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const isFullyPannedRef = useRef({
    right: false,
    down: false,
    left: false,
    up: false,
  })

  const { current: gridSection } = gridSectionRef
  const { current: gridContainer } = gridContainerRef
  const { current: isFullyPanned } = isFullyPannedRef

  const viewportWidth = gridSection?.offsetWidth || 0
  const viewportHeight = gridSection?.offsetHeight || 0

  const gridWidth = gridContainer?.offsetWidth || 0
  const gridHeight = gridContainer?.offsetHeight || 0

  const effectiveWidth = gridWidth * zoomLevel
  const effectiveHeight = gridHeight * zoomLevel

  const updatePanPosition = (
    dx: number,
    dy: number,
    isInverted: boolean = false,
  ) => {
    const newX = isInverted ? position.x + dx : position.x - dx
    const newY = isInverted ? position.y + dy : position.y - dy

    const shouldCenterHorizontally = effectiveWidth <= viewportWidth
    const shouldCenterVertically = effectiveHeight <= viewportHeight

    const adjustedX = shouldCenterHorizontally
      ? (viewportWidth - effectiveWidth) / 2
      : clamp(newX, viewportWidth - effectiveWidth, 0)

    const adjustedY = shouldCenterVertically
      ? (viewportHeight - effectiveHeight) / 2
      : clamp(newY, viewportHeight - effectiveHeight, 0)

    setPosition({ x: adjustedX, y: adjustedY })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const isLeftClick = e.button === 0
    const isOnGrid = (e.target as HTMLElement).dataset.isgrid === "true"

    if (!isLeftClick || !isOnGrid) return

    dragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return

    const dx = e.clientX - lastPosition.current.x
    const dy = e.clientY - lastPosition.current.y

    updatePanPosition(dx, dy, true)
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
    else updatePanPosition(deltaX, deltaY)
  }

  const handleZoom = (deltaY: number) => {
    const zoomDelta = -deltaY * 0.01
    const newZoom = clamp(zoomLevel + zoomDelta, 0.1, 5)

    const scale = newZoom / zoomLevel

    const newX = position.x * scale + ((1 - scale) * viewportWidth) / 2
    const newY = position.y * scale + ((1 - scale) * viewportHeight) / 2

    dispatch({ type: "SET_ZOOM_LEVEL", zoomLevel: newZoom })
    setPosition({ x: newX, y: newY })
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePanPosition(0, 0)
    }, 250)

    return () => clearTimeout(timeoutId)
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

  useEffect(() => {
    if (!gridSection || !gridContainer) return

    const gridSectionRect = gridSection?.getBoundingClientRect()
    const gridContainerRect = gridContainer?.getBoundingClientRect()

    isFullyPanned.right = gridContainerRect.right - 1 <= gridSectionRect.right
    isFullyPanned.down = gridContainerRect.bottom <= gridSectionRect.bottom
    isFullyPanned.left = gridContainerRect.left >= gridSectionRect.left
    isFullyPanned.up = gridContainerRect.top >= gridSectionRect.top
  }, [gridSection, gridContainer, gridWidth, gridHeight, position, zoomLevel])

  return (
    <section
      data-testid="game-board-section"
      ref={gridSectionRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      css={[tw`relative w-full h-screen overflow-hidden`]}
    >
      <div
        data-testid="game-board-container"
        ref={gridContainerRef}
        css={[
          tw`w-fit transition-transform duration-[25ms] ease-linear cursor-grab origin-[0% 0%]`,
          tw`active:cursor-grabbing`,
          `transform: translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
          !backgroundImage && tw`w-[3000px] h-[3000px] bg-white`,
        ]}
      >
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Background"
            onLoad={() => dispatch({ type: "SET_ZOOM_LEVEL", zoomLevel: 1 })}
            css={[tw`max-w-none w-auto h-auto`]}
          />
        )}
        <Canvas
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          isFullyPanned={isFullyPanned}
          updatePanPosition={updatePanPosition}
        />
        <Grid />
      </div>
      <ZoomMenu
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        originalWidth={gridWidth}
        originalHeight={gridHeight}
        position={position}
        setPosition={setPosition}
      />
    </section>
  )
}

export default GameBoard
