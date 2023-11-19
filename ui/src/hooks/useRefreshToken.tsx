import { User } from "@/types"
import { useGlobalState } from "./useGlobalState"

export const useRefreshToken = () => {
  const { state, setState } = useGlobalState()

  const refresh = async () => {
    try {
      const response = await fetch(`http://localhost:1337/refresh_token`, {
        method: "POST",
        credentials: "include",
      })

      const { accessToken, user } =
        (await response.json()) as RefreshTokenResponse

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

type RefreshTokenResponse = {
  accessToken: string
  user: User
}
