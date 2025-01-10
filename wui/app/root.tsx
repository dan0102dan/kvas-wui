import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'

import { MantineProvider, AppShell } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'

import { Header, Navbar } from './components'
import {
  type AuthContextProps,
  LangProvider, AuthProvider
} from './contexts'
import { getSession, commitSession } from './utils'
import { getUserByKey } from './api/licenseApi'


export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'))
  const userData = session.get('user') as AuthContextProps

  if (userData) {
    return json({ user: userData })
  }

  const apiUser = await getUserByKey('string')

  if (apiUser) {
    session.set('user', apiUser)
    return json<AuthContextProps>(
      { user: apiUser },
      { headers: { 'Set-Cookie': await commitSession(session) } }
    )
  }

  session.unset('user')
  return json<AuthContextProps>({ user: undefined }, { headers: { 'Set-Cookie': await commitSession(session) } })
}

export default function App() {
  const [opened, { toggle }] = useDisclosure()

  const { user } = useLoaderData<AuthContextProps>()

  return (
    <html lang="ru">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <Notifications />
          <LangProvider>
            <AuthProvider user={user}>
              <AppShell
                header={{ height: { base: 60 } }}
                navbar={{
                  width: { base: 220 },
                  breakpoint: 'sm',
                  collapsed: { mobile: !opened },
                }}
                padding="md"
              >
                <AppShell.Header>
                  <Header opened={opened} toggle={toggle} />
                </AppShell.Header>
                <AppShell.Navbar>
                  <Navbar toggle={toggle} />
                </AppShell.Navbar>
                <AppShell.Main>
                  <Outlet />
                </AppShell.Main>
              </AppShell>
            </AuthProvider>
          </LangProvider>
        </MantineProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
