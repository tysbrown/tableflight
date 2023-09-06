import type { Game } from "@/types"
import { gql, useQuery } from "urql"

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

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <section>
      <h1>Games:</h1>
      <ul>
        {data.games.map((game: Game) => (
          <li key={game.id}>{game.name}</li>
        ))}
      </ul>
    </section>
  )
}

export default HomeView
