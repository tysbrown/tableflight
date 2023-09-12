import HomeView from "./components/organisms/HomeView";
import LoginView from "./components/organisms/LoginView";
import { useGlobalStateContext } from "./context/useGlobalContext";
import useInitializeAuth from "./hooks/useInitializeAuth";

const App = () => {
  const isInitialized = useInitializeAuth();
  const { state } = useGlobalStateContext();
  const { isLoggedIn } = state || {};

  if (!isInitialized) return <div>Initializing the UI...</div>;
  if (!isLoggedIn) return <LoginView />;
  return <HomeView />;
};

export default App;
