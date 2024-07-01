import React, { useRef, useState } from 'react'
import tw from 'twin.macro'
import { Menu, MenuItem, SliderInput, Button } from '@/atoms'
import { useGridState } from '@/hooks'
import { GridState } from '@/contexts'

type ZoomMenuProps = {
  viewportWidth: number
  viewportHeight: number
  originalWidth: number
  originalHeight: number
  position: { x: number; y: number }
  setPosition: React.Dispatch<
    React.SetStateAction<{
      x: number
      y: number
    }>
  >
}

const ZoomMenu = ({
  viewportWidth,
  viewportHeight,
  originalWidth,
  originalHeight,
  position,
  setPosition,
}: ZoomMenuProps) => {
  const { state, dispatch } = useGridState()
  const { zoomLevel } = state as GridState

  const [zoomMenuIsOpen, setZoomMenuIsOpen] = useState<boolean>(false)
  const zoomMenuRef = useRef<HTMLButtonElement | null>(null)

  const zoomToFitContainer = () => {
    const widthRatio = viewportWidth / originalWidth
    const heightRatio = viewportHeight / originalHeight
    const newZoom = Math.min(widthRatio, heightRatio)

    dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel: newZoom })
  }

  const setZoomLevel = (newZoom: number) => {
    const scale = newZoom / zoomLevel

    const newX = position.x * scale + ((1 - scale) * viewportWidth) / 2
    const newY = position.y * scale + ((1 - scale) * viewportHeight) / 2

    setPosition({ x: newX, y: newY })
    dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel: newZoom })
  }

  return (
    <>
      <Button
        style="primary"
        type="button"
        ref={zoomMenuRef}
        css={[tw`flex items-center gap-1 absolute top-4 right-4 px-2 py-0`]}
        onClick={() => setZoomMenuIsOpen((prev) => !prev)}
      >
        {Math.round(zoomLevel * 100)}%
        <svg
          fill="#000000"
          height="10px"
          width="10px"
          version="1.1"
          id="Layer_1"
          viewBox="0 0 386.257 386.257"
          css={[
            tw`transition-transform duration-200`,
            zoomMenuIsOpen && tw`transform scale-y-[-1]`,
          ]}
        >
          <polygon points="0,96.879 193.129,289.379 386.257,96.879 " />
        </svg>
      </Button>

      <Menu
        anchorElement={zoomMenuRef}
        isOpen={zoomMenuIsOpen}
        setIsOpen={setZoomMenuIsOpen}
      >
        <MenuItem
          css={[tw`px-6 pb-5 cursor-default`, tw`hover:bg-surfaceContainer`]}
        >
          <SliderInput
            hideValueLabel
            name="zoom"
            min={0.1}
            max={2}
            step={0.01}
            value={zoomLevel}
            setValue={setZoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
          />
        </MenuItem>
        <MenuItem css={[tw`p-0`]}>
          <Button
            style="text"
            type="button"
            onClick={() => setZoomLevel(0.1)}
            css={[tw`w-full text-left py-2 px-3`]}
          >
            Zoom to 10%
          </Button>
        </MenuItem>
        <MenuItem css={[tw`p-0`]}>
          <Button
            style="text"
            type="button"
            onClick={() => setZoomLevel(0.5)}
            css={[tw`w-full text-left py-2 px-3`]}
          >
            Zoom to 50%
          </Button>
        </MenuItem>
        <MenuItem css={[tw`p-0`]}>
          <Button
            style="text"
            type="button"
            onClick={() => setZoomLevel(1)}
            css={[tw`w-full text-left py-2 px-3`]}
          >
            Zoom to 100%
          </Button>
        </MenuItem>
        <MenuItem css={[tw`p-0`]}>
          <Button
            style="text"
            type="button"
            onClick={() => setZoomLevel(2)}
            css={[tw`w-full text-left py-2 px-3`]}
          >
            Zoom to 200%
          </Button>
        </MenuItem>
        <MenuItem css={[tw`p-0`]}>
          <Button
            style="text"
            type="button"
            onClick={zoomToFitContainer}
            css={[tw`w-full text-left py-2 px-3`]}
          >
            Fit to screen
          </Button>
        </MenuItem>
      </Menu>

      <div
        css={[
          tw`hidden absolute top-0 bottom-0 left-0 right-0`,
          zoomMenuIsOpen && tw`block`,
        ]}
      />
    </>
  )
}

export default ZoomMenu
