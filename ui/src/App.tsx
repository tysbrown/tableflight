import { useEffect, useState } from "react"
import HomeView from "./components/organisms/HomeView"
import LoginView from "./components/organisms/LoginView"
import { useGlobalStateContext } from "./context/useGlobalContext"
import { useRefreshToken } from "./hooks/useRefreshToken"

const App = () => {
  const [initializing, setInitializing] = useState(true)
  const refreshToken = useRefreshToken()
  const { state, setState } = useGlobalStateContext()
  const { isLoggedIn } = state || {}

  useEffect(() => {
    const callRefreshToken = async () => {
      const userRefreshedAuthToken = await refreshToken()

      if (userRefreshedAuthToken) {
        setState({ ...state, isLoggedIn: true })
      }

      setInitializing(false)
    }

    callRefreshToken()
  }, [])

  if (initializing) return <div>Initializing the UI...</div>

  if (isLoggedIn === false) return <LoginView />

  return <HomeView />
}

export default App
