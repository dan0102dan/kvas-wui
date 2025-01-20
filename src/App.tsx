import { Outlet } from 'react-router-dom'
import { MantineProvider, AppShell } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'

import { Header, Navbar } from './components'
import { useAuth } from './contexts'

function App() {
  const [opened, { toggle }] = useDisclosure(false)
  const { user } = useAuth()

  return (
    <MantineProvider theme={{ defaultRadius: 'md' }}>
      <Notifications />
      <AppShell
        // disabled={!user} // чтобы интерфейс был задизейблен без user
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
    </MantineProvider>
  )
}

export default App
