import { gql, useQuery } from 'urql'
import tw from 'twin.macro'
import { Button, SliderInput } from '@/atoms'
import {
  ControlPanel,
  NewTokenPanel,
  GameSelectModal,
  UploadMapPanel,
} from '@/molecules'
import { GameBoard } from '@/organisms'
import { LoadingView } from '@/views'
import { useGridState } from '@/hooks'
import { GridState } from '@/contexts'
import { Game } from '~common'

const gameListQuery = gql`
  query userGameList {
    userGameList {
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
  const [{ data, fetching, error }] = useQuery<{ userGameList: Game[] }>({
    query: gameListQuery,
  })

  const { state, dispatch } = useGridState()
  const { cellSize, mode } = state as GridState

  const setCellSize = (cellSize: number) => {
    dispatch({ type: 'SET_CELL_SIZE', cellSize })
  }

  if (fetching) return <LoadingView />
  if (error) return <p>Oh no... {error.message}</p>

  console.log('process env Node env:', process.env.NODE_ENV)
  console.log('vite env Node env: ', import.meta.env.NODE_ENV)

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
          step={0.001}
          onChange={(e) =>
            dispatch({
              type: 'SET_CELL_SIZE',
              cellSize: parseInt(e.target.value),
            })
          }
        />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <NewTokenPanel />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <UploadMapPanel />
        <hr css={[tw`border-outlineVariant mt-12 mb-8`]} />
        <h2 css={[tw`mb-3`]}>Set Mode</h2>
        <p css={[tw`mb-3`]}>
          Current Mode: <b>{mode.toUpperCase()}</b>
        </p>
        <section css={[tw`flex flex-wrap gap-3`]}>
          <Button
            type="button"
            style="primary"
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'draw' })}
          >
            Draw
          </Button>
          <Button
            type="button"
            style="primary"
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'pan' })}
          >
            Pan
          </Button>
        </section>
      </ControlPanel>

      <GameSelectModal games={data?.userGameList} />
    </main>
  )
}

export default HomeView
