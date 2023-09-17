import React from "react"
import type { Game } from "@/types"
import { gql, useQuery } from "urql"
import Grid from "../atoms/Grid"
import LoadingView from "../molecules/LoadingView"
import tw from "twin.macro"

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

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <main css={[tw`relative w-full h-screen`]}>
      <Grid cellSize={40} />

      <section>
        <h1>Games:</h1>
        <ul>
          {data?.games?.map((game: Game) => <li key={game.id}>{game.name}</li>)}
        </ul>
      </section>
    </main>
  )
}

export default HomeView
