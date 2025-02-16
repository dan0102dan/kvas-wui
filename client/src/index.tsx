import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/carousel/styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import { routes } from './routes'
import { LangProvider } from './contexts'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: routes.map((route) => {
      if (route.path === '/') {
        return {
          index: true,
          element: route.element,
        }
      } else {
        return {
          path: route.path,
          element: route.element,
        }
      }
    }),
  },
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto" theme={{ defaultRadius: 'md' }}>
      <Notifications />
      <LangProvider>
        <RouterProvider router={router} />
      </LangProvider>
    </MantineProvider>
  </React.StrictMode>,
)
