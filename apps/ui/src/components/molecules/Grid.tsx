import React, { useEffect, useRef } from "react"
import tw from "twin.macro"
import { Token } from "@/atoms"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"
import { DroppedToken } from "@/types"

/**
 * Dynamic SVG grid component that renders a grid of cells based on the dimensions
 * of its parent container and the provided cell size.
 *
 * @remarks
 * The entire grid is a drop zone, and the Drag and Drop API is used to add and remove tokens.
 */
const Grid = () => {
  const { state, dispatch } = useGridState()
  const { grid, rows, cols, dimensions, lineWidth, cellSize, zoomLevel } =
    state as GridState

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect
      dispatch({ type: "SET_DIMENSIONS", dimensions: { width, height } })
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef, dispatch])

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

    const { newToken, token, row, col } = JSON.parse(
      dataTransfer.getData("application/json"),
    ) as DroppedToken

    const rect = currentTarget.getBoundingClientRect()

    const droppedX = clientX - rect.left
    const droppedY = clientY - rect.top

    const newCol = Math.floor(droppedX / cellSize / zoomLevel)
    const newRow = Math.floor(droppedY / cellSize / zoomLevel)

    if (!newToken) dispatch({ type: "REMOVE_TOKEN", x: col, y: row })
    dispatch({ type: "ADD_TOKEN", x: newCol, y: newRow, token })
  }

  const handleDragOver = (event: React.DragEvent<SVGElement>) => {
    event.preventDefault()
  }

  return (
    <div
      ref={containerRef}
      css={[tw`absolute top-0 left-0 right-0 bottom-0 overflow-hidden`]}
    >
      <svg
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-isgrid={true}
        css={[tw`w-full h-full border border-gray-600`]}
      >
        {horizontalLines}
        {verticalLines}
      </svg>
      {grid?.map(
        (row, rowIndex) =>
          row?.map((cell, colIndex) => {
            if (!cell) return null

            return (
              <Token
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
