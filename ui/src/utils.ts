/**
 * @module Utils
 */

/**
 * Check's the user agent to determine if the browser is Firefox.
 * @memberof Utils
 * @returns {boolean} True if the browser is Firefox, false otherwise.
 */
export const isFirefox = !!navigator.userAgent.match(/firefox|fxios/i)

/**
 * Enforces boundaries, ensures that a value is not less than min and not greater than max.
 * @memberof Utils
 * @returns The value clamped between min and max.
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.max(Math.min(value, max), min)
