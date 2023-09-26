import type { Game, GridType, Token } from "@/types"
import { useState } from "react"
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

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <main css={[tw`flex overflow-hidden`]}>
      <section css={[tw`h-screen overflow-scroll`]}>
        <div
          css={[
            tw`relative w-fit`,
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
