import type { Game } from "@/types"
import { useState } from "react"
import { gql, useQuery } from "urql"
import tw from "twin.macro"
import Grid from "../atoms/Grid"
import SliderInput from "../atoms/SliderInput"
import LoadingView from "../molecules/LoadingView"
import Menu from "../molecules/Menu"

const gamesQuery = gql`
  query Games {
    games {
      id
      description
      name
    }
  }
`

const HomeView = () => {
  const [{ data, fetching, error }] = useQuery({
    query: gamesQuery,
  })
  const [cellSize, setCellSize] = useState(50)

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <main css={[tw`relative w-[2000px] h-[3000px]`]}>
      <Grid cellSize={cellSize} lineWidth={0.5} />
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
