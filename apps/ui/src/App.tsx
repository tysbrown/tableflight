import { useGlobalState, useInitializeAuth } from '@/hooks'
import { LoadingView, LoginView, HomeView } from '@/views'

const App = () => {
  const isInitialized = useInitializeAuth()
  const { state } = useGlobalState()
  const { isLoggedIn } = state || {}

  if (!isInitialized) return <LoadingView />
  if (!isLoggedIn) return <LoginView />
  return <HomeView />
}

export default App
