import type { Game, GridType, Token } from "@/types"
import React, { useRef, useState } from "react"
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
  const dragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const selectingToken = useRef(false)

  const rows = Math.ceil(dimensions.height / cellSize)
  const cols = Math.ceil(dimensions.width / cellSize)
  const initialGrid = Array.from({ length: rows }, () => Array(cols).fill(null))

  const [grid, setGrid] = useState<GridType>(initialGrid)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)

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

  /**
   * B
   * @param x
   * @param y
   * @returns
   */
  const clampPosition = (x: number, y: number) => {
    if (!gridContainerRef.current) return { x, y } // added a guard here

    const sectionDimensions = gridContainerRef.current.getBoundingClientRect()

    const minX = sectionDimensions.width - dimensions.width
    const maxX = 0

    const minY = sectionDimensions.height - dimensions.height
    const maxY = 0

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectingToken.current) {
      selectingToken.current = false // Reset the flag after checking
      return
    }

    dragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return

    const dx = e.clientX - lastPosition.current.x
    const dy = e.clientY - lastPosition.current.y

    const newPos = { x: position.x + dx, y: position.y + dy }
    const clampedPosition = clampPosition(newPos.x, newPos.y)

    setPosition(clampedPosition)
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    if (selectingToken.current) {
      selectingToken.current = false // Reset the flag after checking
      return
    }
    dragging.current = false
  }

  // Custom screen panning with trackpad
  const handleWheel = (e: React.WheelEvent) => {
    const dx = e.deltaX
    const dy = e.deltaY

    const newPos = { x: position.x - dx, y: position.y - dy }
    const clampedPosition = clampPosition(newPos.x, newPos.y)

    setPosition(clampedPosition)
  }

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <main css={[tw`flex overflow-hidden`]}>
      <section
        ref={gridContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        css={[tw`relative h-screen overflow-hidden`]}
      >
        <div
          css={[
            tw`w-fit`,
            `transform: translate(${position.x}px, ${position.y}px)`,
            !backgroundImage && tw`w-[1500px] h-[1920px]`,
          ]}
        >
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt="Background"
              css={[tw`max-w-none w-auto h-auto`]}
            />
          )}
          <Grid
            dimensions={dimensions}
            grid={grid}
            setDimensions={setDimensions}
            addTokenToGrid={addTokenToGrid}
            selectingToken={selectingToken}
            removeTokenFromGrid={removeTokenFromGrid}
            rows={rows}
            cols={cols}
            cellSize={cellSize}
            lineWidth={0.5}
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
