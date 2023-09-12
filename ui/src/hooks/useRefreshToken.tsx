import { useGlobalStateContext } from "../context/useGlobalContext"

export function useRefreshToken() {
  const { state, setState } = useGlobalStateContext()

  async function refresh() {
    console.log("refreshAuth")
    try {
      const response = await fetch(`http://localhost:1337/refresh_token`, {
        method: "POST",
        credentials: "include",
      })
      const { accessToken, user } = await response.json()
      // If the refresh token is invalid, log the user out
      if (!accessToken) {
        setState({ ...state, isLoggedIn: false })
        // Optionally handle other stuff here
        return false // indicate refresh failed
      }
      setState({ ...state, accessToken, user, isLoggedIn: true })
      return true // indicate refresh was successful
    } catch (error) {
      console.error("Error refreshing token:", error)
      return false // indicate refresh failed due to an error
    }
  }

  return refresh
}
