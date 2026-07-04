import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GlobalStateProvider } from './contexts/GlobalStateProvider'
import { BoardProvider } from './contexts/BoardProvider'
import URQLProvider from './contexts/URQLProvider'
import GlobalStyles from './styles/GlobalStyles'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <BoardProvider>
        <URQLProvider>
          <GlobalStyles />
          <App />
        </URQLProvider>
      </BoardProvider>
    </GlobalStateProvider>
  </React.StrictMode>,
)
