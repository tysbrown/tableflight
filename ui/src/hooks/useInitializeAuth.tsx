import { useState, useEffect } from "react"
import { useGlobalStateContext } from "../context/useGlobalContext"
import { useRefreshToken } from "./useRefreshToken"

const useInitializeAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { setState } = useGlobalStateContext()
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
