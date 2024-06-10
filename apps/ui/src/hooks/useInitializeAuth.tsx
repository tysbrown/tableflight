import { useState, useEffect } from "react"
import { useGlobalState } from "./useGlobalState"
import { useRefreshToken } from "./useRefreshToken"

export const useInitializeAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { setState } = useGlobalState()
  const refreshToken = useRefreshToken()

  useEffect(() => {
    const callRefreshToken = async () => {
      const userRefreshedAuthToken = await refreshToken()

      if (userRefreshedAuthToken) {
        setState((prev) => ({ ...prev, isLoggedIn: true }))
      }
    }

    callRefreshToken()
      .then(() => setIsInitialized(true))
      .catch((error) => console.error("Error initializing auth:", error))
  }, [])

  return isInitialized
}
