import { useEffect } from "react"

export const useExecuteOnKeyHold = (
  key: string,
  onKeyDown: () => void,
  onKeyUp: () => void,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key) {
        onKeyDown()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === key) {
        onKeyUp()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [key, onKeyDown, onKeyUp])
}
