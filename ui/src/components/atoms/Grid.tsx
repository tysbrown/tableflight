import type { GridType, Token } from "@/types"
import React, { useEffect, useRef } from "react"
import tw from "twin.macro"
import TokenComponent from "./Token"

type GridProps = {
  dimensions: { width: number; height: number }
  grid: GridType
  setGrid: React.Dispatch<React.SetStateAction<GridType>>
  setDimensions: React.Dispatch<
    React.SetStateAction<{ width: number; height: number }>
  >
  addTokenToGrid: (x: number, y: number, token: Token) => void
  removeTokenFromGrid: (x: number, y: number) => void
  initialGrid: GridType
  rows: number
  cols: number
  cellSize: number
  lineWidth?: number
}

const Grid = ({
  dimensions,
  grid,
  setGrid,
  setDimensions,
  addTokenToGrid,
  removeTokenFromGrid,
  rows,
  cols,
  cellSize,
  lineWidth = 0.5,
}: GridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gridHasNotInitialized = !grid
  const rowsNotSynced = grid.length !== rows
  const colsNotSynced = grid[0] && grid[0].length !== cols

  useEffect(() => {
    if (!containerRef.current) return

    const shouldUpdateGrid =
      gridHasNotInitialized || rowsNotSynced || colsNotSynced

    if (shouldUpdateGrid) {
      const newGrid = Array.from({ length: rows }, (_, y) =>
        Array.from({ length: cols }, (_, x) =>
          grid[y] && grid[y]![x] ? grid[y]![x] : null,
        ),
      )

      setGrid(newGrid)
    }

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
  }, [containerRef, cellSize, rows, cols])

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

  const handleDrop = (event: React.DragEvent<SVGElement>) => {
    event.preventDefault()

    const data = event.dataTransfer.getData("application/json")
    const parsedData = JSON.parse(data)

    console.log(parsedData)

    const { newToken, token, row: origRow, col: origCol } = parsedData

    const rect = event.currentTarget.getBoundingClientRect()
    const droppedX = event.clientX - rect.left
    const droppedY = event.clientY - rect.top

    const col = Math.floor(droppedX / cellSize)
    const row = Math.floor(droppedY / cellSize)

    if (!newToken) removeTokenFromGrid(origCol, origRow)

    addTokenToGrid(col, row, token)
  }

  const handleDragOver = (event: React.DragEvent<SVGElement>) => {
    event.preventDefault()
  }

  return (
    <div ref={containerRef} css={[tw`w-full h-full`]}>
      <svg
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        css={[tw`absolute top-0 left-0 w-full h-full`]}
      >
        {horizontalLines}
        {verticalLines}
      </svg>
      {grid?.map(
        (row, rowIndex) =>
          row?.map((cell, colIndex) => {
            if (!cell) return null

            return (
              <TokenComponent
                key={`${rowIndex}-${colIndex}`}
                token={cell}
                col={colIndex}
                row={rowIndex}
                cellSize={cellSize}
              />
            )
          }),
      )}
    </div>
  )
}

export default Grid
