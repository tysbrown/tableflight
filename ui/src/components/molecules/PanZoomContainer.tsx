import { useEffect, useRef, useState } from "react"
import tw from "twin.macro"

type PanZoomContainerProps = {
  image: HTMLImageElement | null
  backgroundImage: string | null
  isTokenDragging: boolean
  setIsTokenDragging: React.Dispatch<React.SetStateAction<boolean>>
  zoomLevel: number
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>
  children: React.ReactNode
}

/**
 * Container with custom panning and zooming functionality.
 */
const PanZoomContainer = ({
  image,
  backgroundImage,
  isTokenDragging,
  setIsTokenDragging,
  zoomLevel,
  setZoomLevel,
  children,
}: PanZoomContainerProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const dragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })
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

  const containerBufferX = viewportWidth - 100
  const containerBufferY = viewportHeight - 100

  const updatePosition = (
    dx: number,
    dy: number,
    isInverted: boolean = false,
  ) => {
    const { current: gridSection } = gridSectionRef

    if (!gridSection) return

    const viewportWidth = gridSection.offsetWidth
    const viewportHeight = gridSection.offsetHeight

    const effectiveWidth = originalWidth * zoomLevel
    const effectiveHeight = originalHeight * zoomLevel

    const xPos = isInverted ? position.x + dx : position.x - dx
    const yPos = isInverted ? position.y + dy : position.y - dy

    const newPos = {
      x: Math.min(
        containerBufferX,
        Math.max(viewportWidth - effectiveWidth - containerBufferX, xPos),
      ),
      y: Math.min(
        containerBufferY,
        Math.max(viewportHeight - effectiveHeight - containerBufferY, yPos),
      ),
    }

    setPosition(newPos)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return

    const isOnToken = (e.target as HTMLElement).dataset.istoken === "true"

    if (isOnToken) {
      setIsTokenDragging(true)
      return
    }

    dragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTokenDragging) return
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

    setZoomLevel(newZoom)
  }

  const handlePanning = (deltaX: number, deltaY: number) => {
    updatePosition(deltaX, deltaY)
  }

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
          tw`w-fit origin-top-left`,
          `transform: translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
          !backgroundImage && tw`w-screen h-screen bg-white`,
        ]}
      >
        {children}
      </div>
    </section>
  )
}

export default PanZoomContainer
