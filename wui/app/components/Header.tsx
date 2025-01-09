import { useState, useEffect, useMemo } from 'react'
import {
    Link,
    useFetcher,
    useNavigation,
} from '@remix-run/react'
import { Group, Burger, Code, Avatar, Loader, Tooltip } from '@mantine/core'
import { IconUserCircle } from '@tabler/icons-react'
import type { UserResponse } from '../api/licenseApi'
import packageJson from '../../package.json'

interface HeaderProps {
    opened: boolean
    toggle: () => void
}

export default function Header({ opened, toggle }: HeaderProps) {
    const [user, setUser] = useState<UserResponse | null>(null)
    const fetcher = useFetcher()
    const navigation = useNavigation()

    useEffect(() => {
        fetcher.load('/profile')
    }, [fetcher])

    useEffect(() => {
        const data = fetcher.data as { user: UserResponse } | undefined
        if (data && data.user) {
            setUser(data.user)
        }
    }, [fetcher])

    const isLoadingProfile = useMemo(() => {
        return navigation.state === 'loading' && navigation.location?.pathname === '/profile'
    }, [navigation])

    const initials = useMemo(() => {
        if (user?.email) {
            const nameParts = user.email.split('@')[0].split('.')
            const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('')
            return initials.slice(0, 2)
        }
        return null
    }, [user])

    return (
        <Group
            h="100%"
            px="md"
            align="center"
            justify="space-between"
        >
            <Group>
                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="sm"
                    size="sm"
                    aria-label={opened ? 'Закрыть меню' : 'Открыть меню'}
                />
                <Tooltip label={user?.email || 'Неавторизованный пользователь'} position="bottom" withArrow>
                    <Avatar
                        component={Link}
                        to="/profile"
                        color="initials"
                        radius="xl"
                        aria-label="Профиль пользователя"
                    >
                        {isLoadingProfile ? (
                            <Loader color="blue" size={20} />
                        ) : user?.email ? (
                            initials
                        ) : (
                            <IconUserCircle size={20} />
                        )}
                    </Avatar>
                </Tooltip>
            </Group>

            <Code fw={700}>v{packageJson.version}</Code>
        </Group>
    )
}
