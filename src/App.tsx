import { Outlet } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { Header, Navbar, Aside } from './components'
import { useAuth } from './contexts'

function App() {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(false)
  const [asideOpened, { toggle: toggleAside }] = useDisclosure(false)

  const { user } = useAuth()

  return (
    <AppShell
      disabled={!user}
      header={{ height: { base: 60 } }}
      navbar={{
        width: { base: 220 },
        breakpoint: 'sm',
        collapsed: { mobile: !navbarOpened },
      }}
      aside={{
        width: { base: 250 },
        breakpoint: 'sm',
        collapsed: { mobile: !asideOpened, desktop: !asideOpened },
      }}
    >
      <AppShell.Header>
        <Header
          navbarOpened={navbarOpened}
          asideOpened={asideOpened}
          toggleNavbar={toggleNavbar}
          toggleAside={toggleAside}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar toggle={toggleNavbar} />
      </AppShell.Navbar>

      <AppShell.Aside>
        <Aside />
      </AppShell.Aside>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
