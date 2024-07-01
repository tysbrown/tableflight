import { useEffect } from "react"

/**
 * Hook that executes a callback when a click occurs outside of the provided ref.
 */
export const useOutsideClick = (
  ref: React.MutableRefObject<HTMLElement | null>,
  anchorElement: React.MutableRefObject<HTMLElement | null>,
  callback: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const didClickOutside =
        !ref?.current?.contains(event.target as Node) &&
        !anchorElement?.current?.contains(event.target as Node)

      if (didClickOutside) {
        callback()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [ref, callback])
}
