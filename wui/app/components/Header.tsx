import { Group, Burger, Code, Avatar, Tooltip } from '@mantine/core'
import { Link } from '@remix-run/react'
import { IconUserCircle } from '@tabler/icons-react'
import packageJson from '../../package.json'
import { useAuth } from '../contexts/Auth'

interface HeaderProps {
    opened: boolean
    toggle: () => void
}

const Header: React.FC<HeaderProps> = ({ opened, toggle }) => {
    const { user } = useAuth()

    const initials = user?.userId
        ? user.userId.toString().slice(0, 2)
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
                    label={'Личный кабинет'}
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

export default Header