import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Header, Navbar } from './components'
import { routes } from './pages/routes'

const App: React.FC = () => {
  const [opened, { toggle }] = useDisclosure()

  return (
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
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
