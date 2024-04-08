import type { Line } from "@/types"
import { useEffect, useRef, useState } from "react"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"
import tw from "twin.macro"
import React from "react"

type CanvasProps = {
  gridWidth: number
  gridHeight: number
}

const Canvas = ({ gridWidth, gridHeight }: CanvasProps) => {
  const { state, dispatch } = useGridState()
  const { zoomLevel, mode, canvas } = state as GridState
  const { lines } = canvas

  const isDrawMode = mode === "draw"
  const isPanMode = mode === "pan"

  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)
  const [currentLine, setCurrentLine] = useState<Line & { isEditing?: string }>(
    {
      id: "",
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      color: "",
      lineWidth: 0,
    },
  )

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    redrawCanvas()
  }, [lines, currentLine])

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    lines.forEach((line) => drawLine(context, line))

    if (isDrawing) {
      drawLine(context, currentLine)
    }
  }

  const drawLine = (context: CanvasRenderingContext2D, line: Line) => {
    context.beginPath()
    context.moveTo(line.startX, line.startY)
    context.lineTo(line.endX, line.endY)
    context.strokeStyle = line.color
    context.lineWidth = line.lineWidth
    context.stroke()
  }

  const handleClick = (event: React.MouseEvent) => {
    if (!canvasRef.current) return

    const { x, y } = getMousePosition(event)

    // User is drawing a new line
    if (!isDrawing) {
      setCurrentLine({
        id: `line-${x}-${y}-${lines.length}`,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: "black",
        lineWidth: 2,
      })
      setIsDrawing(true)
    } else {
      const newLine = {
        ...currentLine,
        color: "black",
      }
      dispatch({
        type: "SET_CANVAS",
        canvas: { lines: [...lines, newLine] },
      })
      setIsDrawing(false)
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    const { x, y } = getMousePosition(event)

    const hoveredLineId = getHoveredLineId(x, y)
    const isALineHovered = !!hoveredLineId

    if (isALineHovered) setHoveredLine(hoveredLineId)
    else setHoveredLine(null)

    if (isDrawing) {
      const isDrawingNewLine = !currentLine.isEditing
      const isEditingStart = currentLine.isEditing === "start"
      const isEditingEnd = currentLine.isEditing === "end"
      let isCurrentLineStraight = false

      if (isEditingStart) {
        isCurrentLineStraight = currentLine.endX === x || currentLine.endY === y
        setCurrentLine({
          ...currentLine,
          startX: x,
          startY: y,
          color: isCurrentLineStraight ? "blue" : "black",
        })
      }

      if (isEditingEnd) {
        isCurrentLineStraight =
          currentLine.startX === x || currentLine.startY === y
        setCurrentLine({
          ...currentLine,
          endX: x,
          endY: y,
          color: isCurrentLineStraight ? "blue" : "black",
        })
      }

      if (isDrawingNewLine) {
        isCurrentLineStraight =
          currentLine.startX === x || currentLine.startY === y
        setCurrentLine({
          ...currentLine,
          endX: x,
          endY: y,
          color: isCurrentLineStraight ? "blue" : "black",
        })
      }
    }
  }

  // Gets the mouse position relative to the canvas, accounting for zoom level
  const getMousePosition = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / zoomLevel - 0.5
    const y = (event.clientY - rect.top) / zoomLevel + 1

    return { x, y }
  }

  const getHoveredLineId = (x: number, y: number) => {
    if (!canvasRef.current) return null

    const threshold = 10

    for (const line of lines) {
      const { id, startX, startY, endX, endY } = line

      // Calculate the squared distance from the start of the line to the end
      const lineLengthSquared =
        (endX - startX) * (endX - startX) + (endY - startY) * (endY - startY)

      // Calculate the t parameter for the point on the line closest to the cursor
      let t =
        ((x - startX) * (endX - startX) + (y - startY) * (endY - startY)) /
        lineLengthSquared

      // If the point is outside the line segment, clamp it to the closest endpoint
      t = Math.max(0, Math.min(1, t))

      // Calculate the coordinates of the point on the line closest to the cursor
      const closestX = startX + t * (endX - startX)
      const closestY = startY + t * (endY - startY)

      // Calculate the distance from the cursor to the closest point on the line
      const distanceToLine = Math.hypot(closestX - x, closestY - y)

      // If the distance is less than or equal to the line thickness, the cursor is over the line
      if (distanceToLine <= threshold) return id
    }

    return null
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        width={gridWidth}
        height={gridHeight}
        css={[
          tw`absolute top-0 left-0 right-0 bottom-0`,
          `width: ${gridWidth}px;`,
          `height: ${gridHeight}px;`,
          isPanMode && tw`z-0`,
          isDrawMode && tw`z-10 cursor-crosshair`,
        ]}
      />
      {lines.map((line: Line) => {
        if (line.id !== hoveredLine) return null

        return (
          <>
            <button
              key={`${line.id} - ${line.startX} - ${line.startY}`}
              css={[
                tw`absolute w-2 h-2 bg-black rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-10 `,
                `top: ${line.startY}px;`,
                `left: ${line.startX}px;`,
              ]}
              onClick={() => {
                setIsDrawing(true)
                dispatch({
                  type: "SET_CANVAS",
                  canvas: {
                    lines: lines.filter((l) => l.id !== line.id),
                  },
                })
                setCurrentLine({ ...line, isEditing: "start" })
              }}
            ></button>
            <button
              css={[
                tw`absolute w-2 h-2 bg-black rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-10 `,
                `top: ${line.endY}px;`,
                `left: ${line.endX}px;`,
              ]}
              onClick={() => {
                setIsDrawing(true)
                dispatch({
                  type: "SET_CANVAS",
                  canvas: {
                    lines: lines.filter((l) => l.id !== line.id),
                  },
                })
                setCurrentLine({ ...line, isEditing: "end" })
              }}
            ></button>
          </>
        )
      })}
    </>
  )
}

export default Canvas
