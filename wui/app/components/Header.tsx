import { Group, Burger, Code, Avatar, Tooltip } from '@mantine/core'
import { Link } from '@remix-run/react'
import { IconUserCircle } from '@tabler/icons-react'
import packageJson from '../../package.json'
import { useAuth } from '../contexts/Auth'

interface HeaderProps {
    opened: boolean
    toggle: () => void
}

export default function Header({ opened, toggle }: HeaderProps) {
    const { user } = useAuth()

    const initials = user?.email
        ? user.email
            .split('@')[0]
            .split('.')
            .map((part) => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2)
        : null

    return (
        <Group h="100%" px="md" align="center" justify="space-between">
            <Group>
                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="sm"
                    size="sm"
                    aria-label={opened ? 'Закрыть меню' : 'Открыть меню'}
                />
                <Tooltip
                    label={user?.email || 'Неавторизованный пользователь'}
                    position="bottom"
                    withArrow
                >
                    <Avatar
                        component={Link}
                        to="/profile"
                        color="initials"
                        radius="xl"
                        aria-label="Профиль пользователя"
                    >
                        {user ? initials : <IconUserCircle size={20} />}
                    </Avatar>
                </Tooltip>
            </Group>

            <Code fw={700}>v{packageJson.version}</Code>
        </Group>
    )
}
