import tw from "twin.macro"
import { PanZoomContainer } from "@/organisms"
import { Grid } from "@/molecules"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"

const GameBoard = () => {
  const { state, dispatch } = useGridState()
  const { backgroundImage } = state as GridState
  return (
    <PanZoomContainer>
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="Background"
          onLoad={() => dispatch({ type: "SET_ZOOM_LEVEL", zoomLevel: 1 })}
          css={[tw`max-w-none w-auto h-auto`]}
        />
      )}
      <Grid />
    </PanZoomContainer>
  )
}

export default GameBoard
