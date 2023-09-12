import { useGlobalStateContext } from "../context/useGlobalContext"

export const useRefreshToken = () => {
  const { state, setState } = useGlobalStateContext()

  const refresh = async () => {
    console.log("refreshing token...")

    try {
      const response = await fetch(`http://localhost:1337/refresh_token`, {
        method: "POST",
        credentials: "include",
      })

      const { accessToken, user } = await response.json()

      if (!accessToken) {
        setState({ ...state, isLoggedIn: false })
        return false
      }

      setState({ ...state, accessToken, user, isLoggedIn: true })
      return true
    } catch (error) {
      console.error("Error refreshing token:", error)
      return false
    }
  }

  return refresh
}
