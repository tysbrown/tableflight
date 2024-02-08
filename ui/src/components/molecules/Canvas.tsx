import type { Line } from "@/types"
import { useRef, useState } from "react"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"
import tw from "twin.macro"

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

  // Using a ref so React doesn't have to re-render the entire
  // canvas every time the mouse moves while drawing a new line.
  const currentLine = useRef<Line>({
    id: "",
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    color: "",
    lineWidth: 0,
  })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
    if (!isDrawing || !canvasRef.current) return

    const { x, y } = getPositionRelativeToZoom(event)

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

  return (
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
  )
}

export default Canvas
