import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css' // core styles are required for all packages
import App from './App'
import { LangProvider } from './contexts'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider defaultColorScheme='auto'>
        <LangProvider>
          <App />
        </LangProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
)
