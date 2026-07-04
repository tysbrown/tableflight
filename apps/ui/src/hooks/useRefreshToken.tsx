import { User } from '~common'
import { useGlobalState } from './useGlobalState'
import axios from 'axios'

export const useRefreshToken = () => {
  const { state, setState } = useGlobalState()

  return async () => {
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_URL,
        {
          query: REFRESH_TOKEN_MUTATION,
        },
        {
          withCredentials: true,
        },
      )

      const { accessToken, user, ok } = data.data
        .refreshToken as RefreshTokenResponse

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

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken {
    refreshToken {
      ok
      accessToken
      user {
        id
        tokenVersion
        firstName
        lastName
        email
      }
    }
  }
`

type RefreshTokenResponse = {
  accessToken: string
  user: User
  ok: boolean
}
