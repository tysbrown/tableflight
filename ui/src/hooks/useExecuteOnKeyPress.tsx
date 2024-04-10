import { useEffect } from "react"

/**
 * Hook that executes a callback when the provided key is pressed
 * @param callback - A function to be executed
 */
export const useExecuteOnKeyPress = (key: string, callback: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key) {
        callback()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [callback])
}
