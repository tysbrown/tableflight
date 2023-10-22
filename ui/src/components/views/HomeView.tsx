import React from "react"
import { gql, useQuery } from "urql"
import tw from "twin.macro"
import { SliderInput } from "@/atoms"
import { ControlPanel, NewTokenPanel, GameSelectModal } from "@/molecules"
import { GameBoard } from "@/organisms"
import { LoadingView } from "@/views"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"

const gamesQuery = gql`
  query Games {
    games {
      id
      description
      image
      name
    }
  }
`
/**
 * The main view of the application when the user logs in.
 */
const HomeView = () => {
  const [{ data, fetching, error }] = useQuery({
    query: gamesQuery,
  })

  const { state, dispatch } = useGridState()
  const { cellSize } = state as GridState

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        dispatch({
          type: "SET_BACKGROUND",
          backgroundImage: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const setCellSize = (cellSize: number) => {
    dispatch({ type: "SET_CELL_SIZE", cellSize })
  }

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <main css={[tw`flex overflow-hidden`]}>
      <GameBoard />

      <ControlPanel>
        <SliderInput
          name="cellSize"
          label="Cell Size"
          value={cellSize}
          setValue={setCellSize}
          min={10}
          max={100}
          onChange={(e) =>
            dispatch({
              type: "SET_CELL_SIZE",
              cellSize: parseInt(e.target.value),
            })
          }
        />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <NewTokenPanel />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <section>
          <input type="file" onChange={handleFileChange} accept="image/*" />
        </section>
      </ControlPanel>

      <GameSelectModal games={data?.games} />
    </main>
  )
}

export default HomeView
