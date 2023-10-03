import type { GridType, Token } from "@/types"
import React, { useEffect, useRef } from "react"
import tw from "twin.macro"
import TokenComponent from "../atoms/Token"

type GridProps = {
  grid: GridType
  dimensions: { width: number; height: number }
  setDimensions: React.Dispatch<
    React.SetStateAction<{ width: number; height: number }>
  >
  setIsTokenDragging: React.Dispatch<React.SetStateAction<boolean>>
  addTokenToGrid: (x: number, y: number, token: Token) => void
  removeTokenFromGrid: (x: number, y: number) => void
  rows: number
  cols: number
  cellSize: number
  lineWidth?: number
  zoomLevel: number
}
/**
 * Dynamic SVG grid component that renders a grid of cells based on the dimensions
 * of its parent container and the provided cell size.
 *
 * @remarks
 * The entire grid is a drop zone, and the Drag and Drop API is used to add and remove tokens.
 */
const Grid = ({
  grid,
  dimensions,
  setDimensions,
  setIsTokenDragging,
  addTokenToGrid,
  removeTokenFromGrid,
  rows,
  cols,
  cellSize,
  lineWidth = 0.5,
  zoomLevel,
}: GridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
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
    const { currentTarget, clientX, clientY, dataTransfer } = event
    event.preventDefault()

    setIsTokenDragging(false)

    const { newToken, token, row, col } = JSON.parse(
      dataTransfer.getData("application/json"),
    )

    const rect = currentTarget.getBoundingClientRect()

    const droppedX = (clientX - rect.left)
    const droppedY = (clientY - rect.top)

    const newCol = Math.floor(droppedX / cellSize)
    const newRow = Math.floor(droppedY / cellSize)

    if (!newToken) removeTokenFromGrid(col, row)
    addTokenToGrid(newCol, newRow, token)
  }

  const handleDragOver = (event: React.DragEvent<SVGElement>) => {
    event.preventDefault()
  }

  return (
    <div ref={containerRef} css={[tw`absolute top-0 left-0 right-0 bottom-0`]}>
      <svg
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        css={[tw`w-full h-full`]}
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
