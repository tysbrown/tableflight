import type { Game, GridType, Token } from "@/types"
import React, { useEffect, useRef, useState } from "react"
import { gql, useQuery } from "urql"
import tw from "twin.macro"
import Grid from "../molecules/Grid"
import SliderInput from "../atoms/SliderInput"
import LoadingView from "../molecules/LoadingView"
import Menu from "../molecules/Menu"
import NewTokenPanel from "../molecules/NewTokenPanel"

const gamesQuery = gql`
  query Games {
    games {
      id
      description
      name
    }
  }
`
/**
 * The main view of the application when the user logs in.
 *
 * @todo - Add inputs for dynamic height and width setting
 */
const HomeView = () => {
  const [{ data, fetching, error }] = useQuery({
    query: gamesQuery,
  })

  const [cellSize, setCellSize] = useState(50)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const dragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const gridSectionRef = useRef<HTMLDivElement>(null)

  const rows = Math.ceil(dimensions.height / cellSize)
  const cols = Math.ceil(dimensions.width / cellSize)
  const initialGrid = Array.from({ length: rows }, () => Array(cols).fill(null))

  const [grid, setGrid] = useState<GridType>(initialGrid)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [isTokenDragging, setIsTokenDragging] = useState<boolean>(false)

  const addTokenToGrid = (x: number, y: number, token: Token) => {
    setGrid(([...grid]) => {
      if (!grid[y]) grid[y] = Array(cols).fill(null)
      grid[y]![x] = token
      return grid
    })
  }

  const removeTokenFromGrid = (x: number, y: number) => {
    setGrid(([...grid]) => {
      grid[y]![x] = null
      return grid
    })
  }

  const clampPosition = (x: number, y: number) => {
    return { x, y }
    // if (!gridSectionRef.current) return { x, y }

    // const viewportBounds = gridSectionRef.current.getBoundingClientRect()
    // const effectiveWidth = dimensions.width * zoomLevel
    // const effectiveHeight = dimensions.height * zoomLevel

    // // Buffer distance is the percentage of the effective width/height.
    // const bufferX = effectiveWidth * 0.2 // e.g., 20% of effective width
    // const bufferY = effectiveHeight * 0.2 // e.g., 20% of effective height

    // // Conditions differ based on whether the effectiveWidth/Height is smaller or larger than the viewport
    // const maxX =
    //   effectiveWidth <= viewportBounds.width
    //     ? viewportBounds.width - effectiveWidth + bufferX
    //     : bufferX
    // const minX =
    //   effectiveWidth <= viewportBounds.width
    //     ? -bufferX
    //     : viewportBounds.width - effectiveWidth - bufferX

    // const maxY =
    //   effectiveHeight <= viewportBounds.height
    //     ? viewportBounds.height - effectiveHeight + bufferY
    //     : bufferY
    // const minY =
    //   effectiveHeight <= viewportBounds.height
    //     ? -bufferY
    //     : viewportBounds.height - effectiveHeight - bufferY

    // const clampedX = Math.min(maxX, Math.max(x, minX))
    // const clampedY = Math.min(maxY, Math.max(y, minY))

    // return { x: clampedX, y: clampedY }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null

    if (file) {
      const reader = new FileReader()

      reader.onloadend = () => {
        setBackgroundImage(reader.result as string)
      }

      reader.readAsDataURL(file)
    }
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

    const newPos = { x: position.x + dx, y: position.y + dy }
    const clampedPosition = clampPosition(newPos.x, newPos.y)

    setPosition(clampedPosition)
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    dragging.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (backgroundImage && (e.ctrlKey || e.metaKey)) {
      // Capture pinch-to-zoom
      const zoomDelta = -e.deltaY * 0.001
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + zoomDelta))
      const adjustedPosition = clampPosition(position.x, position.y)
      setPosition(adjustedPosition)
      setZoomLevel(newZoom)
    } else {
      // Handle panning
      const dx = e.deltaX
      const dy = e.deltaY
      const newPos = { x: position.x - dx, y: position.y - dy }
      const clampedPosition = clampPosition(newPos.x, newPos.y)
      setPosition(clampedPosition)
    }
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

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <main css={[tw`flex overflow-hidden`]}>
      <section
        ref={gridSectionRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        css={[tw`relative h-screen overflow-hidden border border-blue-500`]}
      >
        <div
          ref={gridContainerRef}
          css={[
            tw`w-fit border-4 border-red-500`,
            `transform: translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            !backgroundImage && tw`w-screen h-screen`,
          ]}
        >
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt="Background"
              css={[tw`max-w-none w-auto h-auto origin-center`]}
            />
          )}
          <Grid
            dimensions={dimensions}
            grid={grid}
            setDimensions={setDimensions}
            addTokenToGrid={addTokenToGrid}
            removeTokenFromGrid={removeTokenFromGrid}
            rows={rows}
            cols={cols}
            cellSize={cellSize}
            lineWidth={0.5}
            setIsTokenDragging={setIsTokenDragging}
          />
        </div>
      </section>

      <Menu>
        <SliderInput
          name="cellSize"
          label="Cell Size"
          value={cellSize}
          setValue={setCellSize}
          min={10}
          max={100}
          onChange={(e) => setCellSize(parseInt(e.target.value))}
        />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <NewTokenPanel />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <section>
          <input type="file" onChange={handleFileChange} accept="image/*" />
        </section>
      </Menu>
      <section css={[tw`absolute bottom-0 left-0`]}>
        <h1>Games:</h1>
        <ul>
          {data?.games?.map((game: Game) => <li key={game.id}>{game.name}</li>)}
        </ul>
      </section>
    </main>
  )
}

export default HomeView
