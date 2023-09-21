/**
 * @module Utils
 */

/**
 * Check's the user agent to determine if the browser is Firefox.
 * @memberof Utils
 * @returns {boolean} True if the browser is Firefox, false otherwise.
 */
export const isFirefox = !!navigator.userAgent.match(/firefox|fxios/i)
