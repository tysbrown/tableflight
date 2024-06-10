import { useRef } from "react"
import { isFirefox, clamp } from "@/utils"
import tw from "twin.macro"

type SliderInputProps = {
  name: string
  label?: string
  value: number
  setValue:
    | React.Dispatch<React.SetStateAction<number>>
    | ((value: number) => void)
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  hideValueLabel?: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Custom Slider component with an on hover floating value label.
 *
 * @remarks
 * A custom thumb is needed for the floating value label to align properly above the thumb.
 * This is due to the way the thumb's width affects the position of the label.
 *
 */
const SliderInput = ({
  name,
  label,
  value,
  setValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  hideValueLabel = false,
  onChange,
  ...props
}: SliderInputProps) => {
  const sliderRef = useRef<HTMLInputElement | null>(null)
  const percentage = ((value - min) / (max - min)) * 100

  const handleMouseMove = (e: MouseEvent) => {
    const rect = sliderRef.current!.getBoundingClientRect()

    const newValueToPercentage =
      ((e.clientX - rect.left) / rect.width) * (max - min) + min

    const newValueAdjustedForStep =
      Math.round(newValueToPercentage / step) * step

    const newValueClamped = clamp(newValueAdjustedForStep, min, max)

    setValue(newValueClamped)
  }

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove)
  }

  const handleMouseDown = () => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp, { once: true })
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = sliderRef.current!.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const width = rect.width

    const clickedPercentage = (clickPosition / width) * 100

    const newValueToPercentage = (clickedPercentage / 100) * (max - min) + min

    const newValueAdjustedForStep =
      Math.round(newValueToPercentage / step) * step

    const newValueClamped = clamp(newValueAdjustedForStep, min, max)

    setValue(newValueClamped)
  }

  return (
    <div
      css={[tw`relative flex flex-col w-full`, disabled && tw`opacity-25`]}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled}
      {...props}
    >
      <label htmlFor={name} tw="mb-4">
        {label}
      </label>
      <input
        ref={sliderRef}
        type="range"
        name={name}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={onChange}
        className="peer"
        css={[
          tw`appearance-none cursor-pointer bg-transparent`,
          tw`focus:outline-none`,
          tw`[&::-moz-focus-outer]:(border-0)`,
          tw`[&::-webkit-slider-thumb]:(appearance-none w-0)`,
          tw`[&::-moz-range-thumb]:(appearance-none w-0)`,
          tw`[&::-webkit-slider-runnable-track]:(bg-surfaceContainerHighest h-1)`,
          tw`[&::-moz-range-track]:(bg-surfaceContainerHighest h-1)`,
          tw`[&::-moz-range-progress]:(bg-primary h-1)`,
          isFirefox && tw`absolute -bottom-2 w-full`,
          !isFirefox && tw`before:(absolute bottom-0 left-0 bg-primary h-1)`,
          !isFirefox &&
            `
            &:before {
              width: ${percentage}%;,
            }
          `,
        ]}
      />

      {/* Progress Fill & Thumb */}
      <div
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        className="peer"
        css={[
          tw`absolute bottom-0 left-0 bg-primary h-1 cursor-pointer`,
          tw`after:(absolute -bottom-2 right-0 bg-primary w-5 h-5 rounded-full translate-x-1/2 z-20)`,
          `width: ${percentage}%;`,
        ]}
      />

      {/* Thumb Halo */}
      <div
        css={[
          tw`absolute bottom-[-18px] -translate-x-1/2 bg-primary opacity-0 w-10 h-10 rounded-full transition-opacity duration-200 ease-in-out z-0`,
          tw`peer-hover:opacity-[0.08]`,
          tw`peer-focus:opacity-[0.12]`,
          tw`peer-active:opacity-[0.12]`,
          `left: ${percentage}%;`,
        ]}
      />

      {/* Value Label */}
      {!hideValueLabel && (
        <div
          css={[
            tw`flex justify-center items-center absolute bottom-6 w-7 h-7 -translate-x-1/2 bg-primary rounded-full text-onPrimary text-xs leading-5 z-20 transition transform scale-0 origin-bottom ease-in-out duration-200`,
            tw`peer-hover:scale-100`,
            tw`peer-focus:scale-100`,
            tw`after:(content-[""] font-medium absolute bottom-[-7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] 
            border-l-transparent border-r-[10px] border-r-transparent border-t-[11px] border-t-primary z-10)`,
            `left: ${percentage}%;`,
          ]}
        >
          {Math.round(value)}
        </div>
      )}
    </div>
  )
}

export default SliderInput
