import type { Line } from "~common"
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"
import { useGridState } from "@/hooks/useGridState"
import { useExecuteOnKeyPress } from "@/hooks/useExecuteOnKeyPress"
import { GridState, SetCanvasAction } from "@/contexts"
import { clamp, getTailwindColorHex } from "@/utils"
import tw from "twin.macro"
import React from "react"
import { useExecuteOnKeyHold } from "@/hooks/useExecuteOnKeyHold"

type CanvasProps = {
  gridWidth: number
  gridHeight: number
  viewportWidth: number
  viewportHeight: number
  isFullyPanned: { right: boolean; left: boolean; up: boolean; down: boolean }
  updatePanPosition: (dx: number, dy: number, isInverted?: boolean) => void
}

const Canvas = ({
  gridWidth,
  gridHeight,
  viewportWidth,
  viewportHeight,
  isFullyPanned,
  updatePanPosition,
}: CanvasProps) => {
  const { state, dispatch } = useGridState()
  const { zoomLevel, mode, canvas } = state as GridState
  const { lines } = canvas

  const scaleFactor = 1 / zoomLevel
  const lineHandleSize = 8 * scaleFactor
  const emptyLine: Line = {
    id: "",
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    color: "",
    lineWidth: 0,
  }

  const isDrawMode = mode === "draw"
  const isPanMode = mode === "pan"

  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [isHoverDisabled, setIsHoverDisabled] = useState<boolean>(false)
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)
  const [currentLine, setCurrentLine] = useState<Line & { isEditing?: string }>(
    emptyLine,
  )
  const [isAutoPanning, setIsAutoPanning] = useState<boolean>(false)
  const [isInBounds, setIsInBounds] = useState({
    right: false,
    left: false,
    up: false,
    down: false,
  })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const editedLineOriginal = useRef<Line | null>(null)
  const autoPanSpeed = useRef<number>(10)

  const blue500Hex = getTailwindColorHex("blue", "500")
  const gray500Hex = getTailwindColorHex("gray", "500")

  const isEditing = currentLine.isEditing

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    lines.forEach((line) => drawLine(context, line))

    if (isDrawing) {
      drawLine(context, currentLine)
    }
  }, [lines, currentLine])

  const drawLine = (context: CanvasRenderingContext2D, line: Line) => {
    context.beginPath()
    context.moveTo(line.startX, line.startY)
    context.lineTo(line.endX, line.endY)
    context.strokeStyle = line.color
    context.lineWidth = line.lineWidth
    context.stroke()
  }

  const getMousePositionOnCanvas = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / zoomLevel - 0.5
    const y = (event.clientY - rect.top) / zoomLevel + 1

    return { x, y }
  }

  /**
   * Uses principles of vector math, geometry, and linear algebra to determine
   * if the cursor is hovering over a line. Prioritizes line handles over line bodies,
   * the nearest line if multiple lines are hovered, and the handle of the most recently
   * hovered line if the cursor is on overlapping line handles.
   */
  const scanForHoveredLines = useCallback(
    (x: number, y: number) => {
      if (isDrawing || isHoverDisabled) return

      const threshold = 10 * scaleFactor

      let nearestHandleDistance = Infinity
      let nearestHandleLineId = null
      let handleHovered = false

      // Handles
      lines.forEach((line) => {
        const { id, startX, startY, endX, endY } = line
        const distanceToStartHandle = Math.hypot(x - startX, y - startY)
        const distanceToEndHandle = Math.hypot(x - endX, y - endY)

        // If this handle is closer than any previously checked and the mouse is over a handle
        if (
          distanceToStartHandle <= threshold ||
          distanceToEndHandle <= threshold
        ) {
          handleHovered = true
          if (hoveredLine === id) {
            // If the current line is already hovered, prioritize its handle
            nearestHandleLineId = id
            nearestHandleDistance = 0 // Ensure this handle is prioritized
          } else if (
            distanceToStartHandle < nearestHandleDistance ||
            distanceToEndHandle < nearestHandleDistance
          ) {
            // Update the nearest handle if closer and not already prioritizing another handle
            nearestHandleDistance = Math.min(
              distanceToStartHandle,
              distanceToEndHandle,
            )
            nearestHandleLineId = id
          }
        }
      })

      if (nearestHandleLineId) {
        setHoveredLine(nearestHandleLineId)
        return
      }

      // Line bodies
      if (!handleHovered) {
        let nearestLineDistance = Infinity
        let nearestLineId = null

        lines.forEach(({ id, startX, startY, endX, endY }) => {
          // Calculate the squared distance from the start of the line to the
          // end, representing the line as a vector.
          const lineLengthSquared = (endX - startX) ** 2 + (endY - startY) ** 2

          if (lineLengthSquared === 0) return

          // Calculate the t parameter for the point on the line closest to the cursor using
          // the dot product of the vector from the start of the line to the cursor and the
          // vector representing the line itself.
          let t =
            ((x - startX) * (endX - startX) + (y - startY) * (endY - startY)) /
            lineLengthSquared

          // Clamp t to the range [0, 1] to ensure the point lies within the line segment, not
          // on its infinite extension.
          t = clamp(t, 0, 1)

          // Calculate the coordinates of the point on the line closest to the cursor using the
          // line equation in vector form.
          const closestX = startX + t * (endX - startX)
          const closestY = startY + t * (endY - startY)

          // Calculate the Euclidean distance from the cursor to the closest point on the line
          // using the Pythagorean theorem.
          const distanceToLine = Math.hypot(closestX - x, closestY - y)

          // If the distance is less than or equal to a defined threshold, conclude that the
          // cursor is hovering over this line. If this line is closer than any previously checked
          // lines, update the nearest line.
          if (
            distanceToLine <= threshold &&
            distanceToLine < nearestLineDistance
          ) {
            nearestLineDistance = distanceToLine
            nearestLineId = id
          }
        })

        setHoveredLine(nearestLineId)
      }
    },
    [isDrawing, isHoverDisabled, hoveredLine],
  )

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!canvasRef.current) return

      const { x, y } = getMousePositionOnCanvas(event)

      if (!isDrawing) {
        // User is drawing a new line
        setCurrentLine({
          id: `line-${x}-${y}-${lines.length}`,
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          color: "#000",
          lineWidth: 2,
        })
        setIsDrawing(true)
      } else {
        const updatedLine = {
          ...currentLine,
          color: "#000",
        }
        dispatch({
          type: "SET_CANVAS",
          canvas: { lines: [...lines, updatedLine] },
        })
        setCurrentLine(emptyLine)
        setIsDrawing(false)
        setIsAutoPanning(false)
      }
    },
    [getMousePositionOnCanvas, isDrawing, currentLine, lines, dispatch],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const { x, y } = getMousePositionOnCanvas(event)

      scanForHoveredLines(x, y)

      if (isDrawing) {
        const isDrawingNewLine = !currentLine.isEditing
        const isEditingStart = currentLine.isEditing === "start"
        const isEditingEnd = currentLine.isEditing === "end"
        let isCurrentLineStraight = false

        if (isEditingStart) {
          isCurrentLineStraight =
            currentLine.endX === x || currentLine.endY === y
          setCurrentLine({
            ...currentLine,
            startX: x,
            startY: y,
            color: isCurrentLineStraight ? gray500Hex : "#000",
          })
        }

        if (isEditingEnd) {
          isCurrentLineStraight =
            currentLine.startX === x || currentLine.startY === y
          setCurrentLine({
            ...currentLine,
            endX: x,
            endY: y,
            color: isCurrentLineStraight ? gray500Hex : "#000",
          })
        }

        if (isDrawingNewLine) {
          isCurrentLineStraight =
            currentLine.startX === x || currentLine.startY === y

          setCurrentLine({
            ...currentLine,
            endX: x,
            endY: y,
            color: isCurrentLineStraight ? gray500Hex : "#000",
          })
        }

        // Auto pan if the cursor is near the edge of the viewport
        const threshold = 50
        const isInRightBounds = event.clientX >= viewportWidth - threshold
        const isInLeftBounds = event.clientX <= threshold
        const isInTopBounds = event.clientY <= threshold
        const isInBottomBounds = event.clientY >= viewportHeight - threshold

        const shouldAutoPan =
          isInRightBounds || isInLeftBounds || isInTopBounds || isInBottomBounds

        // Pan faster the closer the cursor is to the edge of the viewport
        if (isInRightBounds)
          autoPanSpeed.current =
            Math.abs((event.clientX - viewportWidth + threshold) / threshold) *
            10
        if (isInBottomBounds)
          autoPanSpeed.current =
            Math.abs((event.clientY - viewportHeight + threshold) / threshold) *
            10
        if (isInLeftBounds)
          autoPanSpeed.current =
            Math.abs((event.clientX - threshold) / threshold) * 10
        if (isInTopBounds)
          autoPanSpeed.current =
            Math.abs((event.clientY - threshold) / threshold) * 10

        setIsInBounds({
          right: isInRightBounds,
          left: isInLeftBounds,
          up: isInTopBounds,
          down: isInBottomBounds,
        })

        if (shouldAutoPan) setIsAutoPanning(true)
        else setIsAutoPanning(false)
      }
    },
    [scanForHoveredLines, isDrawing, currentLine, gray500Hex],
  )

  const handleLineHover = () => {
    if (hoveredLine) {
      dispatch({
        type: "SET_CANVAS",
        canvas: {
          lines: lines.map((line) => {
            if (line.id === hoveredLine) {
              return { ...line, color: blue500Hex }
            }
            // Handles case where cursor goes from hovering one line to hovering another
            return { ...line, color: "#000" }
          }),
        },
      })
    } else {
      dispatch({
        type: "SET_CANVAS",
        canvas: {
          lines: lines.map((line) => {
            if (line.color === blue500Hex) {
              return { ...line, color: "#000" }
            }
            return line
          }),
        },
      })
    }
  }

  const cancelCurrentLineDraw = () => {
    if (isDrawing && !isEditing) {
      setIsDrawing(false)
      setCurrentLine(emptyLine)
    }

    if (isDrawing && isEditing) {
      setIsDrawing(false)
      dispatch({
        type: "SET_CANVAS",
        canvas: { lines: [...lines, editedLineOriginal.current!] },
      })
      setCurrentLine(emptyLine)
    }
  }

  const disableHover = () => {
    if (isDrawMode) {
      setIsHoverDisabled(true)
      dispatch({
        type: "SET_CANVAS",
        canvas: {
          lines: lines.map((line) => {
            return { ...line, color: "#000" }
          }),
        },
      })
    }
  }

  const enableHover = () => {
    if (isDrawMode) {
      setIsHoverDisabled(false)
      dispatch({
        type: "SET_CANVAS",
        canvas: {
          lines: lines.map((line) => {
            if (line.id === hoveredLine) {
              return { ...line, color: blue500Hex }
            }
            return line
          }),
        },
      })
    }
  }

  useExecuteOnKeyPress("Escape", () => {
    cancelCurrentLineDraw()
  })

  useExecuteOnKeyHold(
    "Shift",
    () => disableHover(),
    () => enableHover(),
  )

  useEffect(() => {
    redrawCanvas()
  }, [lines, currentLine])

  useEffect(() => {
    handleLineHover()
  }, [hoveredLine])

  useEffect(() => {
    const shouldPanRight = isInBounds.right && !isFullyPanned.right
    const shouldPanLeft = isInBounds.left && !isFullyPanned.left
    const shouldPanUp = isInBounds.up && !isFullyPanned.up
    const shouldPanDown = isInBounds.down && !isFullyPanned.down

    const rate = autoPanSpeed.current

    if (isAutoPanning) {
      let dx = shouldPanRight ? rate : shouldPanLeft ? -rate : 0
      let dy = shouldPanUp ? -rate : shouldPanDown ? rate : 0

      const isEditingStartHandle = isEditing === "start"

      const intervalId = setInterval(() => {
        updatePanPosition(dx, dy)

        const updatedLine = isEditingStartHandle
          ? {
              ...currentLine,
              startX: currentLine.startX + dx,
              startY: currentLine.startY + dy,
            }
          : {
              ...currentLine,
              endX: currentLine.endX + dx,
              endY: currentLine.endY + dy,
            }

        setCurrentLine(updatedLine)

        dx = shouldPanRight ? dx + rate : shouldPanLeft ? dx - rate : 0
        dy = shouldPanUp ? dy - rate : shouldPanDown ? dy + rate : 0
      }, 10)

      return () => clearInterval(intervalId)
    }

    return () => {}
  }, [
    isInBounds,
    currentLine,
    autoPanSpeed,
    isAutoPanning,
    isFullyPanned,
    updatePanPosition,
  ])

  return (
    <>
      <canvas
        data-testid="canvas"
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
      <LineHandles
        lines={lines}
        hoveredLine={hoveredLine}
        lineHandleSize={lineHandleSize}
        editedLineOriginal={editedLineOriginal}
        isHoverDisabled={isHoverDisabled}
        setIsDrawing={setIsDrawing}
        setHoveredLine={setHoveredLine}
        setCurrentLine={setCurrentLine}
        dispatch={dispatch}
      />
    </>
  )
}

type LineHandleProps = {
  lines: Line[]
  hoveredLine: string | null
  lineHandleSize: number
  editedLineOriginal: React.MutableRefObject<Line | null>
  isHoverDisabled: boolean
  setIsDrawing: Dispatch<SetStateAction<boolean>>
  setHoveredLine: Dispatch<SetStateAction<string | null>>
  setCurrentLine: Dispatch<SetStateAction<Line & { isEditing?: string }>>
  dispatch: Dispatch<SetCanvasAction>
}

const LineHandles = ({
  lines,
  hoveredLine,
  lineHandleSize,
  editedLineOriginal,
  isHoverDisabled,
  setIsDrawing,
  setHoveredLine,
  setCurrentLine,
  dispatch,
}: LineHandleProps) => {
  if (isHoverDisabled) return null

  return lines.map((line: Line) => {
    if (line.id !== hoveredLine) return null

    return (
      <div key={`${line.id} - ${line.startX} - ${line.startY}`}>
        <button
          css={[
            tw`absolute bg-blue-500 rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-50`,
            `top: ${line.startY}px;
             left: ${line.startX}px;
             width: ${lineHandleSize}px;
             height: ${lineHandleSize}px;`,
          ]}
          onClick={() => {
            setIsDrawing(true)
            setHoveredLine(null)
            dispatch({
              type: "SET_CANVAS",
              canvas: {
                lines: lines.filter((l) => l.id !== line.id),
              },
            })
            editedLineOriginal.current = { ...line, color: "#000" }
            setCurrentLine({ ...line, isEditing: "start" })
          }}
        ></button>
        <button
          css={[
            tw`absolute bg-blue-500 rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-50`,
            `top: ${line.endY}px;
             left: ${line.endX}px;
             width: ${lineHandleSize}px;
             height: ${lineHandleSize}px;`,
          ]}
          onClick={() => {
            setIsDrawing(true)
            setHoveredLine(null)
            dispatch({
              type: "SET_CANVAS",
              canvas: {
                lines: lines.filter((l) => l.id !== line.id),
              },
            })
            editedLineOriginal.current = { ...line, color: "#000" }
            setCurrentLine({ ...line, isEditing: "end" })
          }}
        ></button>
      </div>
    )
  })
}

export default Canvas

// const snapMouseCursorToPosition = (x: number, y: number) => {
//   const event = new MouseEvent("mousemove", {
//     view: window,
//     bubbles: true,
//     cancelable: true,
//     clientX: x,
//     clientY: y,
//   })
//   document.dispatchEvent(event)
// }
