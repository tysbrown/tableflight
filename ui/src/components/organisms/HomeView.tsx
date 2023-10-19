import React, { useRef, useState } from "react"
import { gql, useQuery } from "urql"
import tw from "twin.macro"
import { SliderInput } from "@/atoms"
import {
  Grid,
  LoadingView,
  ControlPanel,
  NewTokenPanel,
  GameSelectModal,
} from "@/molecules"
import { PanZoomContainer } from "@/organisms"
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
 *
 * @todo - Add inputs for dynamic height and width setting when there's no background image.
 */
const HomeView = () => {
  const [{ data, fetching, error }] = useQuery({
    query: gamesQuery,
  })

  const { state, dispatch } = useGridState()

  const { backgroundImage, cellSize } = state as GridState

  const imageRef = useRef<HTMLImageElement | null>(null)

  // const [shouldShowGameSelect, setShouldShowGameSelect] =
  //   useState<boolean>(true)

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
      <PanZoomContainer
        image={imageRef.current}
        backgroundImage={backgroundImage}
      >
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Background"
            ref={imageRef}
            onLoad={() => dispatch({ type: "SET_ZOOM_LEVEL", zoomLevel: 1 })}
            css={[tw`max-w-none w-auto h-auto`]}
          />
        )}
        <Grid />
      </PanZoomContainer>

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

      {/* <GameSelectModal
        isOpen={shouldShowGameSelect}
        setIsOpen={setShouldShowGameSelect}
        games={data?.games}
      /> */}
    </main>
  )
}

export default HomeView
