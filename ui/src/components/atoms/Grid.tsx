import tw from "twin.macro"

type GridProps = {
  width: number
  height: number
  cellSize: number
}

const Grid = ({ width, height, cellSize }: GridProps) => {
  const horizontalLines = []
  const verticalLines = []

  for (let i = 0; i < height; i += cellSize) {
    horizontalLines.push(<line x1="0" y1={i} x2={width} y2={i} stroke="grey" />)
  }

  for (let i = 0; i < width; i += cellSize) {
    verticalLines.push(<line x1={i} y1="0" x2={i} y2={height} stroke="grey" />)
  }

  return (
    <svg width={width} height={height} css={[tw`absolute top-0 left-0`]}>
      {horizontalLines}
      {verticalLines}
    </svg>
  )
}

export default Grid
