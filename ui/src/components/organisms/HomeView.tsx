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
 * @todo - Add inputs for dynamic height and width setting when there's no background image.
 * @todo - Fix grid cell bug when zoomed in or out.
 * @todo - Fix mouse drag pan and boundary bugs.
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
  const imageRef = useRef<HTMLImageElement>(null)

  const gridSectionRef = useRef<HTMLDivElement>(null)

  const rows = Math.ceil(dimensions.height / cellSize)
  const cols = Math.ceil(dimensions.width / cellSize)
  const initialGrid = Array.from({ length: rows }, () => Array(cols).fill(null))

  const [grid, setGrid] = useState<GridType>(initialGrid)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [isTokenDragging, setIsTokenDragging] = useState<boolean>(false)

  const addTokenToGrid = (x: number, y: number, token: Token) => {
    setGrid((prev) => {
      const newGrid = [...prev]
      if (!newGrid[y]) newGrid[y] = Array(cols).fill(null)
      newGrid[y]![x] = token
      return newGrid
    })
  }

  const removeTokenFromGrid = (x: number, y: number) => {
    setGrid((prev) => {
      const newGrid = [...prev]
      newGrid[y]![x] = null
      return newGrid
    })
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

    setPosition(newPos)
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    dragging.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    const { current: gridSection } = gridSectionRef
    const { current: gridContainer } = gridContainerRef
    const { current: image } = imageRef

    // Only proceed if we have valid refs
    if (!gridSection || !gridContainer || !image) return

    const viewportWidth = gridSection.offsetWidth
    const viewportHeight = gridSection.offsetHeight
    const originalWidth = image.naturalWidth
    const originalHeight = image.naturalHeight

    if (backgroundImage && (e.ctrlKey || e.metaKey)) {
      // Capture pinch-to-zoom
      const zoomDelta = -e.deltaY * 0.001
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + zoomDelta))

      const effectiveWidth = originalWidth * newZoom
      const effectiveHeight = originalHeight * newZoom

      // Update DOM styles
      gridContainer.style.width = `${effectiveWidth}px`
      gridContainer.style.height = `${effectiveHeight}px`
      image.style.width = `${effectiveWidth}px`
      image.style.height = `${effectiveHeight}px`

      setZoomLevel(newZoom)
    } else {
      // Handle panning
      const dx = e.deltaX
      const dy = e.deltaY

      const effectiveWidth = originalWidth * zoomLevel
      const effectiveHeight = originalHeight * zoomLevel

      const newPos = {
        x: Math.min(
          200,
          Math.max(viewportWidth - effectiveWidth - 200, position.x - dx),
        ),
        y: Math.min(
          200,
          Math.max(viewportHeight - effectiveHeight - 200, position.y - dy),
        ),
      }

      setPosition(newPos)
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
        css={[tw`relative w-full h-screen overflow-hidden`]}
      >
        <div
          ref={gridContainerRef}
          css={[
            tw`w-fit`,
            `transform: translate(${position.x}px, ${position.y}px)`,
            !backgroundImage && tw`w-screen h-screen`,
          ]}
        >
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt="Background"
              ref={imageRef}
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
            zoomLevel={zoomLevel}
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
