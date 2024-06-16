import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GlobalStateProvider } from './contexts/GlobalStateProvider'
import { GridStateProvider } from './contexts/GridStateProvider'
import URQLProvider from './contexts/URQLProvider'
import GlobalStyles from './styles/GlobalStyles'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <GridStateProvider>
        <URQLProvider>
          <GlobalStyles />
          <App />
        </URQLProvider>
      </GridStateProvider>
    </GlobalStateProvider>
  </React.StrictMode>
)
