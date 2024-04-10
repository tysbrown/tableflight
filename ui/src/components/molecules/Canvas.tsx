import type { Canvas, Line } from "@/types"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { useGridState } from "@/hooks/useGridState"
import { useExecuteOnKeyPress } from "@/hooks/useExecuteOnKeyPress"
import { GridState, SetCanvasAction } from "@/contexts/GridStateProvider"
import { clamp, getTailwindColorHex } from "@/utils"
import tw from "twin.macro"
import React from "react"
import { useExecuteOnKeyHold } from "@/hooks/useExecuteOnKeyHold"

type CanvasProps = {
  gridWidth: number
  gridHeight: number
}

const Canvas = ({ gridWidth, gridHeight }: CanvasProps) => {
  const { state, dispatch } = useGridState()
  const { zoomLevel, mode, canvas } = state as GridState
  const { lines } = canvas

  const scaleFactor = 1 / zoomLevel
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const editedLineOriginal = useRef<Line | null>(null)

  const blue500Hex = getTailwindColorHex("blue", "500")
  const gray500Hex = getTailwindColorHex("gray", "500")

  const isEditing = currentLine.isEditing

  useExecuteOnKeyPress("Escape", () => {
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
  })

  useExecuteOnKeyHold(
    "Shift",
    () => {
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
    },
    () => {
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
    },
  )

  useEffect(() => {
    redrawCanvas()
  }, [lines, currentLine])

  useEffect(() => {
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
  }, [hoveredLine])

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
        color: "#000",
        lineWidth: 2,
      })
      setIsDrawing(true)
    } else {
      const newLine = {
        ...currentLine,
        color: "#000",
      }
      dispatch({
        type: "SET_CANVAS",
        canvas: { lines: [...lines, newLine] },
      })
      setCurrentLine(emptyLine)
      setIsDrawing(false)
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    const { x, y } = getMousePosition(event)

    scanForHoveredLines(x, y)

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
    }
  }

  /**
   * Gets the mouse position relative to the canvas, accounting for zoom level.
   */
  const getMousePosition = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / zoomLevel - 0.5
    const y = (event.clientY - rect.top) / zoomLevel + 1

    return { x, y }
  }

  /**
   * Uses principles of vector mathematics, geometry, and linear algebra to determine
   * if the cursor is hovering over a line. Prioritizes line handles over line bodies,
   * the nearest line if multiple lines are hovered, and the handle of the most recently
   * hovered line if the cursor is near multiple stacked handles.
   */
  const scanForHoveredLines = (x: number, y: number) => {
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

      lines.forEach((line) => {
        const { id, startX, startY, endX, endY } = line

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
  }

  const handleSizeBasedOnZoom = 8 * scaleFactor

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
      <LineHandles
        lines={lines}
        hoveredLine={hoveredLine}
        handleSizeBasedOnZoom={handleSizeBasedOnZoom}
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
  handleSizeBasedOnZoom: number
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
  handleSizeBasedOnZoom,
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
            tw`absolute bg-blue-500 rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-50 `,
            `top: ${line.startY}px;`,
            `left: ${line.startX}px;`,
            `width: ${handleSizeBasedOnZoom}px;`,
            `height: ${handleSizeBasedOnZoom}px;`,
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
            tw`absolute bg-blue-500 rounded-full cursor-move -translate-x-1/2 -translate-y-1/2 z-50 `,
            `top: ${line.endY}px;`,
            `left: ${line.endX}px;`,
            `width: ${handleSizeBasedOnZoom}px;`,
            `height: ${handleSizeBasedOnZoom}px;`,
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
