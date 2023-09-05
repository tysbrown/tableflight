import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./global.css"
import { Client, Provider, cacheExchange, fetchExchange } from "urql"

const client = new Client({
  url: import.meta.env.VITE_API_URL,
  exchanges: [cacheExchange, fetchExchange],
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </React.StrictMode>,
)
