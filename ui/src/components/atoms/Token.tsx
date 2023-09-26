import { Token } from "@/types"
import tw from "twin.macro"

type TokenComponentProps = {
  row: number
  col: number
  token: Token | null
  cellSize: number
  selectingToken: React.MutableRefObject<boolean>
}

const TokenComponent = ({
  row,
  col,
  token,
  cellSize,
  selectingToken,
}: TokenComponentProps) => {
  const { id, type } = token || {}

  const isPlayer = type === "player"
  const isEnemy = type === "enemy"
  const isNpc = type === "npc"
  const isItem = type === "item"

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    selectingToken.current = true

    const data = JSON.stringify({
      newToken: false,
      row,
      col,
      token,
    })

    event.dataTransfer.setData("application/json", data)
  }

  const tokenColor = isPlayer
    ? tw`bg-primaryContainer`
    : isEnemy
    ? tw`bg-errorContainer`
    : isNpc
    ? tw`bg-tertiaryContainer`
    : isItem
    ? tw`bg-secondaryContainer`
    : tw`bg-gray-500`

  const tokenSize = cellSize * 0.8
  const tokenOffset = (cellSize - tokenSize) / 2 // Centers the token in the cell

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      id={id}
      css={[
        tw`absolute rounded-full content-none cursor-grab`,
        tokenColor,
        {
          left: `${col * cellSize + tokenOffset}px`,
          top: `${row * cellSize + tokenOffset}px`,
          width: `${tokenSize}px`,
          height: `${tokenSize}px`,
        },
      ]}
    />
  )
}

export default TokenComponent
