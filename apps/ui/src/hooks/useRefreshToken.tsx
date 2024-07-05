import { User } from '~common'
import { useGlobalState } from './useGlobalState'
import axios from 'axios'

export const useRefreshToken = () => {
  const { state, setState } = useGlobalState()

  return async () => {
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_REFRESH_TOKEN_URL,
        {},
        {
          withCredentials: true,
        },
      )

      const { accessToken, user, ok } = data as RefreshTokenResponse

      if (!ok) {
        setState({ ...state, isLoggedIn: false })
        return false
      }

      setState({ ...state, accessToken, user, isLoggedIn: true })
      return true
    } catch (error) {
      console.error('Error refreshing token: ', error)
      return false
    }
  }
}

type RefreshTokenResponse = {
  accessToken: string
  user: User
  ok: boolean
}
