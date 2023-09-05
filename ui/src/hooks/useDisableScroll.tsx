import { useEffect } from "react"

/**
 * @description - A hook that disables ability to scroll the page
 * @param isDisabled - A boolean value that determines whether the scroll should be disabled or not
 */

export const useDisableScroll = (isDisabled: boolean) => {
  useEffect(() => {
    if (isDisabled) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
  }, [isDisabled])
}
