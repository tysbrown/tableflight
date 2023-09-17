import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import { GlobalStateProvider } from "./context/GlobalStateProvider.tsx"
import URQLProvider from "./context/URQLProvider"
import GlobalStyles from "./styles/GlobalStyles.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <URQLProvider>
        <GlobalStyles />
        <App />
      </URQLProvider>
    </GlobalStateProvider>
  </React.StrictMode>,
)
