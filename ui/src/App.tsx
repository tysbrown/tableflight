import HomeView from "./components/organisms/HomeView"
import LoginView from "./components/organisms/LoginView"
import { useGlobalState } from "./hooks/useGlobalState"
import useInitializeAuth from "./hooks/useInitializeAuth"
import LoadingView from "./components/molecules/LoadingView"

const App = () => {
  const isInitialized = useInitializeAuth()
  const { state } = useGlobalState()
  const { isLoggedIn } = state || {}

  if (!isInitialized) return <LoadingView />
  if (!isLoggedIn) return <LoginView />
  return <HomeView />
}

export default App
