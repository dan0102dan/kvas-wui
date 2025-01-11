import type { ActionFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, useActionData, useNavigation } from '@remix-run/react'
import { Container, Title, Text, TextInput, Button, Alert } from '@mantine/core'

import { getSession, commitSession, destroySession } from '../utils'
import { useAuth } from '../contexts'
import { getUserByKey } from '../api/licenseApi'
import type { UserResponse } from '../api/licenseApi'

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()
    const logout = formData.get('logout')
    const uniqueKey = formData.get('uniqueKey')?.toString()
    const email = formData.get('email')?.toString()

    const session = await getSession(request.headers.get('Cookie'))

    if (logout) {
        return redirect('/profile', {
            headers: { 'Set-Cookie': await destroySession(session) },
        })
    }

    if (!uniqueKey || !email) {
        return json({ error: 'Укажите уникальный ключ и email' }, { status: 400 })
    }

    let apiUser: UserResponse | null = null
    try {
        apiUser = await getUserByKey(uniqueKey)
    } catch (err) {
        return json({ error: 'Ошибка при запросе пользователя' }, { status: 500 })
    }

    session.set('user', apiUser)

    return redirect('/profile', {
        headers: {
            'Set-Cookie': await commitSession(session),
        },
    })
}

export default function ProfilePage() {
    const { user } = useAuth()
    const actionData = useActionData<{ error?: string }>()
    const navigation = useNavigation()

    const isSubmitting = navigation.state === 'submitting'

    if (!user) {
        return (
            <Container size="xs">
                <Title order={2} mb="md">
                    Авторизация (укажите uniqueKey и email)
                </Title>

                {actionData?.error && (
                    <Alert color="red" mb="md">
                        {actionData.error}
                    </Alert>
                )}

                <Form method="post">
                    <TextInput
                        name="uniqueKey"
                        label="Unique Key"
                        placeholder="Например: MY-UNIQUE-KEY-ABC123"
                        required
                        mb="sm"
                    />
                    <TextInput
                        name="email"
                        label="Email"
                        placeholder="user@example.com"
                        required
                        mb="md"
                    />
                    <Button type="submit" loading={isSubmitting} fullWidth>
                        Войти / Зарегистрироваться
                    </Button>
                </Form>
            </Container>
        )
    }

    return (
        <Container>
            <Title order={2}>Личный кабинет</Title>
            <Text mt="md">
                Вы авторизованы как: <b>{user.email}</b>
            </Text>
            <Text>
                Ваш uniqueKey: <b>{user.uniqueKey}</b>
            </Text>
            <Text>userType: <b>{user.userType}</b></Text>
            {Object.keys(user).map(key => (
                <Text>{key}: <b>{user[key as keyof UserResponse]}</b></Text>
            ))}

            <Form method="post" style={{ marginTop: 20 }}>
                <input type="hidden" name="logout" value="1" />
                <Button type="submit" color="red" variant="outline">
                    Выйти
                </Button>
            </Form>
        </Container>
    )
}
