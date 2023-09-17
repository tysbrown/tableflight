import { useState, useEffect } from "react"
import { useGlobalState } from "./useGlobalState"
import { useRefreshToken } from "./useRefreshToken"

const useInitializeAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { setState } = useGlobalState()
  const refreshToken = useRefreshToken()

  useEffect(() => {
    const callRefreshToken = async () => {
      const userRefreshedAuthToken = await refreshToken()

      if (userRefreshedAuthToken) {
        setState((prev) => ({ ...prev, isLoggedIn: true }))
      }

      setIsInitialized(true)
    }

    callRefreshToken()
  }, [])

  return isInitialized
}

export default useInitializeAuth
