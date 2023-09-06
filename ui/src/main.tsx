import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./global.css"
import URQLProvider from "./context/URQLProvider"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <URQLProvider>
      <App />
    </URQLProvider>
  </React.StrictMode>,
)
