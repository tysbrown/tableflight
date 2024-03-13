import type { Line } from "@/types"
import { useRef, useState } from "react"
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentLine = useRef<Line>({
    id: "",
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    color: "",
    lineWidth: 0,
  })

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    lines.forEach((line) => drawLine(context, line))

    if (isDrawing && currentLine.current.id) {
      drawLine(context, currentLine.current)
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

    const { x, y } = getPositionRelativeToZoom(event)

    if (!isDrawing) {
      currentLine.current = {
        id: `line-${x}-${y}-${lines.length}`,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: "black",
        lineWidth: 2,
      }
      setIsDrawing(true)
    } else {
      dispatch({
        type: "SET_CANVAS",
        canvas: { lines: [...lines, currentLine.current] },
      })
      setIsDrawing(false)
      currentLine.current.color = "black"
      redrawCanvas()
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    const { x, y } = getPositionRelativeToZoom(event)
    let isHovering = false
    for (const line of lines) {
      if (isCursorNearLine(x, y, line)) {
        isHovering = true
        // Optionally, set some state here to know which line is being hovered over
        break
      }
    }

    if (!isDrawing || !canvasRef.current) return
    const isLineStraight =
      currentLine.current.startX === x || currentLine.current.startY === y

    currentLine.current = {
      ...currentLine.current,
      endX: x,
      endY: y,
      color: isLineStraight ? "blue" : "black",
    }

    redrawCanvas()
  }

  const getPositionRelativeToZoom = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / zoomLevel - 0.5
    const y = (event.clientY - rect.top) / zoomLevel + 1

    return { x, y }
  }

  // const cursorIsHoveringALine = (event: React.MouseEvent) => {
  //   if (!canvasRef.current) return false

  //   const { x, y } = getPositionRelativeToZoom(event)

  //   return lines.some((line) => {
  //     const { startX, startY, endX, endY } = line
  //     return (
  //       x > startX - shift &&
  //       x < startX + shift &&
  //       y > startY - shift &&
  //       y < startY + shift
  //     )
  //   })
  // }

  function isCursorNearLine(cursorX, cursorY, line) {
    const { startX, startY, endX, endY } = line

    // Calculate distances to start and end points
    const distToStart = Math.sqrt(
      Math.pow(cursorX - startX, 2) + Math.pow(cursorY - startY, 2),
    )
    const distToEnd = Math.sqrt(
      Math.pow(cursorX - endX, 2) + Math.pow(cursorY - endY, 2),
    )

    // Threshold for considering cursor "close enough" to the line
    const threshold = 10 // Pixels

    if (distToStart < threshold || distToEnd < threshold) {
      return true
    }

    // Optionally, include more accurate point-to-line segment distance calculation
    // to handle cursor hovering over the middle of a line

    return false
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
      {lines.map((line: Line) => (
        <>
          <button
            key={`${line.id} - ${line.startX} - ${line.startY}`}
            css={[
              tw`absolute w-2 h-2 bg-black rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-10 `,
              `top: ${line.startY}px;`,
              `left: ${line.startX}px;`,
            ]}
          ></button>
          <button
            css={[
              tw`absolute w-2 h-2 bg-black rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-10 `,
              `top: ${line.endY}px;`,
              `left: ${line.endX}px;`,
            ]}
          ></button>
        </>
      ))}
    </>
  )
}

export default Canvas
