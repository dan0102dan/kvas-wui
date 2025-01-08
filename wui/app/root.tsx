import '@mantine/core/styles.css'
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react"
import { MantineProvider, AppShell } from "@mantine/core"
import { useDisclosure } from '@mantine/hooks'
import { Header, Navbar } from './components'
import { LangProvider } from "./contexts" // Предполагая, что вы переместите контексты в папку app/contexts

export default function App() {
  const [opened, { toggle }] = useDisclosure()

  return (
    <html lang="ru">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider defaultColorScheme='auto'>
          <LangProvider>
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
          </LangProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
