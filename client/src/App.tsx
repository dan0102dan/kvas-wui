import { Outlet } from 'react-router-dom'
import { AppShell, ScrollArea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { Header, Navbar, Aside } from './components'

function App() {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(false)
  const [asideOpened, { toggle: toggleAside }] = useDisclosure(false)

  return (
    <AppShell
      header={{ height: { base: 60 } }}
      navbar={{
        width: { base: 220 },
        breakpoint: 'sm',
        collapsed: { mobile: !navbarOpened },
      }}
      aside={{
        width: { base: 220 },
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
        <AppShell.Section component={ScrollArea}>
          <Navbar toggle={toggleNavbar} />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Aside p='md'>
        <Aside />
      </AppShell.Aside>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
