import type { Game } from "@/types"
import { useGlobalStateContext } from "../../context/useGlobalContext"
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
  const { state } = useGlobalStateContext()
  const { accessToken } = state || {}

  console.log("access token in homeview: ", accessToken)

  const [{ data, fetching, error }] = useQuery({
    query: gamesQuery,
    // pause: accessToken === undefined,
  })

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <section>
      <h1>Games:</h1>
      <ul>
        {data?.games?.map((game: Game) => <li key={game.id}>{game.name}</li>)}
      </ul>
    </section>
  )
}

export default HomeView
