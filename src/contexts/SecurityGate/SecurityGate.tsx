import React, { createContext, useContext, useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import {
    Center,
    Card,
    Text,
    TextInput,
    Button,
    Stack,
} from '@mantine/core'

interface SecurityContextValue {
    hasPassword: boolean         // Whether a password is set
    isUnlocked: boolean          // Whether the interface is currently unlocked
    setPassword: (newPwd: string) => void
    removePassword: () => void
    logout: () => void
    checkPassword: (pwd: string) => boolean
}

// Default implementation to avoid TS errors:
const SecurityContext = createContext<SecurityContextValue>({
    hasPassword: false,
    isUnlocked: true,
    setPassword: () => { },
    removePassword: () => { },
    logout: () => { },
    checkPassword: () => false,
})

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const [hasPassword, setHasPassword] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(true)
    const [inputValue, setInputValue] = useState('')

    useEffect(() => {
        const storedPassword = localStorage.getItem('appPassword')
        if (storedPassword) {
            setHasPassword(true)
            setIsUnlocked(false)
        } else {
            notifications.show({
                title: 'Пароль не установлен',
                message: 'Вы можете установить пароль в настройках.',
                color: 'yellow',
            })
        }
    }, [])

    /**
     * Установить новый пароль
     */
    const setPassword = (newPwd: string) => {
        const pwd = newPwd.trim()
        if (!pwd) {
            notifications.show({
                title: 'Ошибка',
                message: 'Пароль не может быть пустым.',
                color: 'red',
            })
            return
        }
        localStorage.setItem('appPassword', pwd)
        setHasPassword(true)
        // Lock immediately after setting, so user must re-enter the new password
        setIsUnlocked(false)
        notifications.show({
            title: 'Пароль установлен',
            message: 'Интерфейс защищён. Введите ваш пароль для разблокировки.',
            color: 'blue',
        })
    }

    /**
     * Удалить пароль (сделать интерфейс незащищённым)
     */
    const removePassword = () => {
        localStorage.removeItem('appPassword')
        setHasPassword(false)
        setIsUnlocked(true)
        notifications.show({
            title: 'Пароль удалён',
            message: 'Интерфейс больше не защищён паролем.',
            color: 'yellow',
        })
    }

    /**
     * «Выйти» (заблокировать интерфейс). Если пароль установлен – потребуется ввод для разблокировки.
     */
    const logout = () => {
        if (!hasPassword) {
            notifications.show({
                title: 'Интерфейс не защищен',
                message: 'Пароль не установлен — разлогиниться нельзя.',
                color: 'gray',
            })
            return
        }
        setIsUnlocked(false)
        notifications.show({
            title: 'Блокировка',
            message: 'Интерфейс заблокирован. Введите пароль для разблокировки.',
            color: 'gray',
        })
    }

    /**
     * Проверяем введённый пароль
     */
    const checkPassword = (pwd: string) => {
        const storedPassword = localStorage.getItem('appPassword') || ''
        if (pwd === storedPassword) {
            setIsUnlocked(true)
            setInputValue('')
            notifications.show({
                title: 'Разблокировано',
                message: 'Добро пожаловать!',
                color: 'green',
            })
            return true
        } else {
            notifications.show({
                title: 'Ошибка',
                message: 'Неверный пароль.',
                color: 'red',
            })
            return false
        }
    }

    /**
     * If the interface is locked, render a centered "login" card instead of the protected content.
     */
    if (hasPassword && !isUnlocked) {
        return (
            <Center style={{ width: '100%', height: '100vh' }}>
                <Card shadow="md" padding="lg" withBorder>
                    <Stack gap="md">
                        <Text w={500} size="lg">
                            Интерфейс заблокирован
                        </Text>
                        <TextInput
                            placeholder="Введите пароль"
                            type="password"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.currentTarget.value)}
                        />
                        <Button
                            onClick={() => {
                                checkPassword(inputValue)
                            }}
                        >
                            Разблокировать
                        </Button>
                    </Stack>
                </Card>
            </Center>
        )
    }

    return (
        <SecurityContext.Provider
            value={{
                hasPassword,
                isUnlocked,
                setPassword,
                removePassword,
                logout,
                checkPassword,
            }}
        >
            {children}
        </SecurityContext.Provider>
    )
}

export function useSecurity() {
    return useContext(SecurityContext)
}
