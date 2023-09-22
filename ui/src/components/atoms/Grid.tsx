import { useState, useEffect, useRef } from "react"
import tw from "twin.macro"

type GridProps = {
  cellSize: number
  lineWidth?: number
}

type TokenProps = {
  x: number
  y: number
  cellSize: number
  token: Token
}

type Token = {
  id: string
  type: "player" | "enemy" | "npc" | "item"
}

type GridType = (Token | null)[][]

const Grid = ({ cellSize, lineWidth = 0.5 }: GridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const rows = Math.ceil(dimensions.height / cellSize)
  const cols = Math.ceil(dimensions.width / cellSize)

  const initialGrid = Array.from({ length: rows }, () => Array(cols).fill(null))
  const [grid, setGrid] = useState<GridType>(initialGrid)

  const addTokenToGrid = (x: number, y: number, token: Token) => {
    setGrid((prevGrid) => {
      const newGrid: GridType = [...prevGrid]
      if (!newGrid[y]) newGrid[y] = Array(cols).fill(null)
      newGrid[y]![x] = token
      return newGrid
    })
  }

  useEffect(() => {
    if (!containerRef.current) return

    const newGrid = Array.from({ length: rows }, () => Array(cols).fill(null))
    setGrid(newGrid)

    addTokenToGrid(1, 3, { id: "1", type: "player" })
  }, [rows, cols])

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        const height = containerRef.current.offsetHeight
        setDimensions({ width, height })
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(containerRef.current)

    updateDimensions()

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef, cellSize])

  const horizontalLines = Array.from({
    length: rows,
  }).map((_, index) => (
    <line
      key={`h-${index}`}
      x1="0"
      y1={index * cellSize}
      x2={dimensions.width}
      y2={index * cellSize}
      stroke="grey"
      strokeWidth={lineWidth}
    />
  ))

  const verticalLines = Array.from({
    length: cols,
  }).map((_, index) => (
    <line
      key={`v-${index}`}
      x1={index * cellSize}
      y1="0"
      x2={index * cellSize}
      y2={dimensions.height}
      stroke="grey"
      strokeWidth={lineWidth}
    />
  ))

  return (
    <div ref={containerRef} css={[tw`absolute top-0 left-0 w-full h-full`]}>
      <svg css={[tw`w-full h-full`]}>
        {horizontalLines}
        {verticalLines}
        {grid?.map(
          (row, rowIndex) =>
            row?.map((cell, colIndex) => {
              if (!cell) return null

              return (
                <TokenComponent
                  token={cell}
                  x={colIndex * cellSize}
                  y={rowIndex * cellSize}
                  cellSize={cellSize}
                />
              )
            }),
        )}
      </svg>
    </div>
  )
}

const TokenComponent = ({ x, y, cellSize, token }: TokenProps) => {
  const { id, type } = token || {}

  const isPlayer = type === "player"
  const isEnemy = type === "enemy"
  const isNpc = type === "npc"
  const isItem = type === "item"

  return (
    <circle
      id={id}
      cx={x + cellSize / 2}
      cy={y + cellSize / 2}
      r={cellSize / 2 - 5}
      fill={
        isPlayer
          ? "green"
          : isEnemy
          ? "red"
          : isNpc
          ? "blue"
          : isItem
          ? "grey"
          : "white"
      }
    />
  )
}

export default Grid
