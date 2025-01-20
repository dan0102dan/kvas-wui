import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Title, Text, TextInput, Button, Alert } from '@mantine/core'
import { showNotification } from '@mantine/notifications'

import { useAuth } from '../contexts'
import { getUserByKey } from '../api/licenseApi'

const ProfilePage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [uniqueKey, setUniqueKey] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Допустим, у нас нет прямого setUser, поэтому сделаем временный костыль:
    // Можно расширить AuthContext, чтобы были login/logout
    const { user: contextUser } = useAuth()
    const hasUser = !!contextUser

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!uniqueKey || !email) {
            setError('Укажите уникальный ключ и email')
            return
        }

        setIsLoading(true)
        try {
            const apiUser = await getUserByKey(uniqueKey)
            // Тут "сохраняем" user в localStorage или в контекст
            localStorage.setItem('userData', JSON.stringify(apiUser))
            // А потом делаем принудительный перерендер:
            window.location.reload() // костыль; лучше иметь setUser в AuthContext
        } catch (err) {
            console.error(err)
            setError('Ошибка при запросе пользователя')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('userData')
        // Перезагрузим страницу или сделаем редирект
        window.location.reload()
    }

    if (!hasUser) {
        // Форма авторизации
        return (
            <Container size="xs">
                <Title order={2} mb="md">
                    Авторизация (укажите uniqueKey и email)
                </Title>

                {error && (
                    <Alert color="red" mb="md">
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleLogin}>
                    <TextInput
                        label="Unique Key"
                        placeholder="Например: MY-UNIQUE-KEY-ABC123"
                        required
                        mb="sm"
                        value={uniqueKey}
                        onChange={(e) => setUniqueKey(e.target.value)}
                    />
                    <TextInput
                        label="Email"
                        placeholder="user@example.com"
                        required
                        mb="md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Button type="submit" loading={isLoading} fullWidth>
                        Войти / Зарегистрироваться
                    </Button>
                </form>
            </Container>
        )
    }

    // Если есть user
    const { userId, email: userEmail, uniqueKey: userKey, userType, ...rest } = user!

    return (
        <Container>
            <Title order={2}>Личный кабинет</Title>
            <Text mt="md">
                Вы авторизованы как: <b>{userEmail}</b>
            </Text>
            <Text>
                Ваш uniqueKey: <b>{userKey}</b>
            </Text>
            <Text>userType: <b>{userType}</b></Text>

            {/* Просто покажем все поля */}
            {Object.entries(rest).map(([k, v]) => (
                <Text key={k}>{k}: <b>{String(v)}</b></Text>
            ))}

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    handleLogout()
                }}
                style={{ marginTop: 20 }}
            >
                <Button type="submit" color="red" variant="outline">
                    Выйти
                </Button>
            </form>
        </Container>
    )
}

export default ProfilePage
