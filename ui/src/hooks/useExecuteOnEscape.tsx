import { useEffect } from "react"

/**
 * Hook that executes a callback when the escape key is pressed
 * @param callback - A function to be executed when the escape key is pressed
 */
export const useExecuteOnEscape = (callback: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        callback()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [callback])
}
