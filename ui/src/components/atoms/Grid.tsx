import React, { useState, useEffect, useRef } from "react"
import tw from "twin.macro"

type GridProps = {
  cellSize: number
}

const Grid = ({ cellSize }: GridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        const height = containerRef.current.offsetHeight
        setDimensions({ width, height })
      }
    }

    // Track changes to the container's dimensions
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(containerRef.current)

    updateDimensions() // Initial dimensions setting

    // Cleanup observers on component unmount
    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef, cellSize])

  const horizontalLines = Array.from({
    length: Math.ceil(dimensions.height / cellSize),
  }).map((_, index) => (
    <line
      key={`h-${index}`}
      x1="0"
      y1={index * cellSize}
      x2={dimensions.width}
      y2={index * cellSize}
      stroke="grey"
    />
  ))

  const verticalLines = Array.from({
    length: Math.ceil(dimensions.width / cellSize),
  }).map((_, index) => (
    <line
      key={`v-${index}`}
      x1={index * cellSize}
      y1="0"
      x2={index * cellSize}
      y2={dimensions.height}
      stroke="grey"
    />
  ))

  return (
    <div ref={containerRef} css={[tw`absolute top-0 left-0 w-full h-full`]}>
      <svg css={[tw`w-full h-full`]}>
        {horizontalLines}
        {verticalLines}
      </svg>
    </div>
  )
}

export default Grid
