import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./global.css"
import { GlobalStateProvider } from "./context/GlobalStateContext.tsx"
import URQLProvider from "./context/URQLProvider"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <URQLProvider>
        <App />
      </URQLProvider>
    </GlobalStateProvider>
  </React.StrictMode>,
)
