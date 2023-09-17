import HomeView from "./components/organisms/HomeView"
import LoginView from "./components/organisms/LoginView"
import { useGlobalState } from "./hooks/useGlobalState"
import useInitializeAuth from "./hooks/useInitializeAuth"

const App = () => {
  const isInitialized = useInitializeAuth()
  const { state } = useGlobalState()
  const { isLoggedIn } = state || {}

  if (!isInitialized) return <div>Initializing the UI...</div>
  if (!isLoggedIn) return <LoginView />
  return <HomeView />
}

export default App
