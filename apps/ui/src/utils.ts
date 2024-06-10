/**
 * @module Utils
 */

import type { DefaultColors } from "tailwindcss/types/generated/colors"
import colors from "tailwindcss/colors"

/**
 * Check's the user agent to determine if the browser is Firefox.
 * @memberof Utils
 * @returns {boolean} True if the browser is Firefox, false otherwise.
 */
export const isFirefox = !!navigator?.userAgent?.match(/firefox|fxios/i)

/**
 * Enforces boundaries, ensures that a value is not less than min and not greater than max.
 * @memberof Utils
 * @returns {number} The value clamped between min and max.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(Math.min(value, max), min)

/**
 *
 * @memberof Utils
 * @returns {string} The hex value of the Tailwind color.
 */
export const getTailwindColorHex = (color: string, shade: string): string => {
  const tailwindColors: DefaultColors = colors
  return (
    (tailwindColors[color as keyof DefaultColors] as Record<string, string>)[
      shade
    ] || ""
  )
}
