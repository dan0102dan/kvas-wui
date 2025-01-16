import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/carousel/styles.css'

import type { LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react'

import { MantineProvider, AppShell, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'

import { Header, Navbar } from './components'
import { type AuthContextProps, LangProvider, AuthProvider } from './contexts'
import { getSession, commitSession } from './utils'


export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'))

  const user = session.get('user') as AuthContextProps
  if (user) {
    return json({ user })
  }

  session.unset('user')
  const url = new URL(request.url)
  if (['/setup', '/contacts'].every(e => e !== url.pathname))
    return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })

  return json<AuthContextProps>({ user: undefined }, { headers: { 'Set-Cookie': await commitSession(session) } })
}

const App: React.FC = () => {
  const [opened, { toggle }] = useDisclosure()

  const { user } = useLoaderData<AuthContextProps>()

  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto" theme={{ defaultRadius: 'md' }}>
          <Notifications />
          <LangProvider>
            <AuthProvider user={user}>
              <AppShell
                disabled={!user}
                header={{ height: { base: 60 } }}
                navbar={{
                  width: { base: 220 },
                  breakpoint: 'sm',
                  collapsed: { mobile: !opened },
                }}
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

export default App