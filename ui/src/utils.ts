/**
 * @function isFirefox
 * @memberof Utils
 * @description
 * Check's the user agent to determine if the browser is Firefox.
 */
export const isFirefox = !!navigator.userAgent.match(/firefox|fxios/i)
