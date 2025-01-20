import React, { createContext, useContext, useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import { Modal, TextInput, Button, Stack, Text } from '@mantine/core'

interface SecurityContextValue {
    hasPassword: boolean      // Есть ли пароль вообще
    isUnlocked: boolean       // Разблокировано ли сейчас
    setPassword: (newPwd: string) => void
    removePassword: () => void
    logout: () => void
    checkPassword: (pwd: string) => boolean
}

/**
 * Контекст для пароля/защиты
 */
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
    const [askPassword, setAskPassword] = useState(false)
    const [inputValue, setInputValue] = useState('')

    // 1. При первом рендере проверяем localStorage
    useEffect(() => {
        const storedPassword = localStorage.getItem('appPassword')
        if (storedPassword) {
            setHasPassword(true)
            setIsUnlocked(false)
            setAskPassword(true) // Показываем окно ввода
        } else {
            // Если пароля нет — уведомляем пользователя (покажется единожды, так как useEffect с пустым deps)
            notifications.show({
                title: 'Внимание',
                message:
                    'Интерфейс не защищен паролем. Вы можете установить пароль в настройках.',
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
        setIsUnlocked(false)
        setAskPassword(true) // Просим ввести для разблокировки
        notifications.show({
            title: 'Пароль установлен',
            message:
                'Теперь интерфейс защищен паролем. Для доступа введите установленный пароль.',
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
        setAskPassword(false)
        notifications.show({
            title: 'Защита снята',
            message: 'Пароль удален, теперь интерфейс не защищен.',
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
        setAskPassword(true)
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
            setAskPassword(false)
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

    // Флаг для показа модального окна ввода пароля:
    // Показываем, если пароль установлен, интерфейс заблокирован и требуется ввод.
    const shouldShowModal = hasPassword && !isUnlocked && askPassword

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
            {/* Модальное окно для ввода пароля */}
            <Modal
                opened={shouldShowModal}
                onClose={() => { }}
                withCloseButton={false}
                closeOnClickOutside={false}
                closeOnEscape={false}
                title="Введите пароль"
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 7,
                }}
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Интерфейс защищен паролем.
                    </Text>
                    <TextInput
                        data-autofocus
                        placeholder="****"
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button
                        onClick={() => {
                            checkPassword(inputValue)
                            setInputValue('')
                        }}
                    >
                        Разблокировать
                    </Button>
                </Stack>
            </Modal>

            {children}
        </SecurityContext.Provider>
    )
}

export function useSecurity() {
    return useContext(SecurityContext)
}