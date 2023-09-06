import HomeView from "./components/organisms/HomeView"
import LoginView from "./components/organisms/LoginView"
import { useGlobalStateContext } from "./context/useGlobalContext"

const App = () => {
  const { state } = useGlobalStateContext()
  const { isLoggedIn } = state || {}

  if (isLoggedIn === false) return <LoginView />
  return <HomeView />
}

export default App
