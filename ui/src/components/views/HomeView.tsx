import React from "react"
import { gql, useQuery } from "urql"
import tw from "twin.macro"
import { SliderInput } from "@/atoms"
import { ControlPanel, NewTokenPanel, GameSelectModal } from "@/molecules"
import { GameBoard } from "@/organisms"
import { LoadingView } from "@/views"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"
import { Game } from "@/types"
import UploadMapPanel from "../molecules/UploadMapPanel"

const gameListQuery = gql`
  query gameList {
    gameList {
      id
      name
      description
      image
      createdById
      updatedAt
    }
  }
`

/**
 * The main view of the application when the user logs in.
 */
const HomeView = () => {
  const [{ data, fetching, error }] = useQuery<{ gameList: Game[] }>({
    query: gameListQuery,
  })

  const { state, dispatch } = useGridState()
  const { cellSize } = state as GridState

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
        <UploadMapPanel />
      </ControlPanel>

      <GameSelectModal games={data?.gameList} />
    </main>
  )
}

export default HomeView
