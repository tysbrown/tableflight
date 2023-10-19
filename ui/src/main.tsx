import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import { GlobalStateProvider } from "@/contexts/GlobalStateProvider.tsx"
import { GridStateProvider } from "@/contexts/GridStateProvider.tsx"
import URQLProvider from "@/contexts/URQLProvider.tsx"
import GlobalStyles from "@/styles/GlobalStyles.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <GridStateProvider>
        <URQLProvider>
          <GlobalStyles />
          <App />
        </URQLProvider>
      </GridStateProvider>
    </GlobalStateProvider>
  </React.StrictMode>,
)
