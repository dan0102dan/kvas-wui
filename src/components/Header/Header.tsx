import React from 'react'
import { Group, Burger, ActionIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'

interface HeaderProps {
    navbarOpened: boolean
    asideOpened: boolean
    toggleNavbar: () => void
    toggleAside: () => void
}

const Header: React.FC<HeaderProps> = ({ navbarOpened, asideOpened, toggleNavbar, toggleAside }) => {
    return (
        <Group h="100%" px="md" align="center" justify="space-between">
            <Group>
                <Burger
                    opened={navbarOpened}
                    onClick={() => {
                        toggleNavbar()
                        asideOpened && toggleAside()
                    }}
                    hiddenFrom="sm"
                    size="sm"
                />
            </Group>

            <ActionIcon
                variant="default"
                onClick={toggleAside}
            >
                <IconSettings size={20} />
            </ActionIcon>
        </Group>
    )
}

export default Header
