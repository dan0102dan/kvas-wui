// app/components/Header.tsx
import { useState, useEffect } from 'react'
import { Link } from '@remix-run/react'
import { Group, Burger, Code, Avatar } from '@mantine/core'
import { IconUserCircle } from '@tabler/icons-react'
import packageJson from '../../package.json'

interface HeaderProps {
    opened: boolean
    toggle: () => void
}

const Header: React.FC<HeaderProps> = ({ opened, toggle }) => {
    const [authorized, setAuthorized] = useState<string>('')

    useEffect(() => {
        const interval = setInterval(() => {
            setAuthorized('A' + Math.random().toString(36).substring(2, 4).toUpperCase())
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <Group
            h="100%"
            px="md"
            align="center"
            justify="space-between"
        >
            <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <Avatar
                    component={Link}
                    to="/profile"
                    color="initials"
                    name={authorized}
                    radius="xl"
                >
                    {!authorized && <IconUserCircle />}
                </Avatar>
            </Group>

            <Code fw={700}>
                v{packageJson.version}
            </Code>
        </Group>
    )
}

export default Header
