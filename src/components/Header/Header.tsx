import React from 'react'
import { Group, Burger, Avatar, ActionIcon } from '@mantine/core'
import { Link } from 'react-router-dom'
import { IconUserCircle, IconSettings } from '@tabler/icons-react'
import { useAuth } from '../../contexts'

interface HeaderProps {
    navbarOpened: boolean
    asideOpened: boolean
    toggleNavbar: () => void
    toggleAside: () => void
}

const Header: React.FC<HeaderProps> = ({ navbarOpened, asideOpened, toggleNavbar, toggleAside }) => {
    const { user } = useAuth()

    const initials = user?.userId
        ? user.userId.toString().slice(0, 2)
        : null

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

                <Avatar
                    component={Link}
                    to="/profile"
                    color="initials"
                    radius="xl"
                >
                    {user ? initials : <IconUserCircle size={20} />}
                </Avatar>
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
