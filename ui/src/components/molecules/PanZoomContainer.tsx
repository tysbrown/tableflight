import { useEffect, useRef, useState } from "react"
import tw from "twin.macro"
import Button from "../atoms/Button"
import { Menu, MenuItem } from "../atoms/Menu"
import SliderInput from "../atoms/SliderInput"

type PanZoomContainerProps = {
  image: HTMLImageElement | null
  backgroundImage: string | null
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
  zoomLevel,
  setZoomLevel,
  children,
}: PanZoomContainerProps) => {
  const [zoomMenuIsOpen, setZoomMenuIsOpen] = useState<boolean>(false)
  const zoomMenuRef = useRef<HTMLButtonElement | null>(null)
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

    let newX, newY

    // Horizontal positioning
    if (effectiveWidth <= viewportWidth) {
      newX = (viewportWidth - effectiveWidth) / 2 + shiftX
    } else {
      newX =
        Math.max(Math.min(xPos, 0), viewportWidth - effectiveWidth) + shiftX
    }

    // Vertical positioning
    if (effectiveHeight <= viewportHeight) {
      newY = (viewportHeight - effectiveHeight) / 2 + shiftY
    } else {
      newY =
        Math.max(Math.min(yPos, 0), viewportHeight - effectiveHeight) + shiftY
    }

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

    setZoomLevel(newZoom)
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

      <Button
        style="primary"
        type="button"
        ref={zoomMenuRef}
        css={[tw`flex items-center gap-1 absolute top-4 right-4 px-2 py-0`]}
        onClick={() => setZoomMenuIsOpen((prev) => !prev)}
      >
        {Math.round(zoomLevel * 100)}%
        <svg
          fill="#000000"
          height="10px"
          width="10px"
          version="1.1"
          id="Layer_1"
          viewBox="0 0 386.257 386.257"
        >
          <polygon points="0,96.879 193.129,289.379 386.257,96.879 " />
        </svg>
      </Button>

      <Menu anchorElement={zoomMenuRef} isOpen={zoomMenuIsOpen}>
        <MenuItem>
          <SliderInput
            hideValueLabel
            name="zoom"
            min={0.1}
            max={2}
            step={0.01}
            value={zoomLevel}
            setValue={setZoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            css={[tw`mb-4`]}
          />
        </MenuItem>
      </Menu>
    </section>
  )
}

export default PanZoomContainer
