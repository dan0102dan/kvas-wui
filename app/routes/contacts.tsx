import React, { useEffect, useState } from 'react'
import { Button, Container, Group, Flex, Stack, Text, Textarea, TextInput, Title, Box, ThemeIcon, Checkbox, Tooltip } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { IconAt, IconPhone, IconClockHour8 } from '@tabler/icons-react'
import type { LoaderFunction, ActionFunction } from '@remix-run/node'
import { Form, useLoaderData, useNavigation } from '@remix-run/react'
import { redirect, json } from '@remix-run/node'
import { getSession, commitSession } from '../utils'
import { useLang } from '../contexts'

interface LoaderData {
    success: string | null
    errors: string[] | null
}

export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))
    const success = session.get('success') as string | null
    const errors = session.get('errors') as string[] | null

    return json(
        { success, errors },
        {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        }
    )
}

export const action: ActionFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))
    const formData = await request.formData()
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const message = formData.get('message') as string

    const errors: string[] = []

    if (!email) errors.push('forms.errors.emailRequired')
    if (!message) errors.push('forms.errors.messageRequired')

    if (errors.length > 0) {
        session.flash('errors', errors)
        return redirect('/contacts', {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        })
    }

    // Эмуляция API запроса с задержкой
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Эмуляция успешного или ошибочного ответа
    const isSuccess = Math.random() > 0.2
    if (isSuccess) {
        session.flash('success', 'notifications.successMessage')
    } else {
        session.flash('errors', ['notifications.errorSendFailed'])
    }

    return redirect('/contacts', {
        headers: {
            'Set-Cookie': await commitSession(session),
        },
    })
}

const Contacts: React.FC = () => {
    const navigation = useNavigation()
    const { t } = useLang()
    const { success, errors } = useLoaderData<LoaderData>()
    const isSubmitting = navigation.state === 'submitting'

    const [formData, setFormData] = useState({
        email: '',
        name: '',
        message: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    useEffect(() => {
        if (success) {
            showNotification({
                title: t('notifications.successTitle'),
                message: t(success),
                color: 'green',
            })
            setFormData({
                email: '',
                name: '',
                message: '',
            })
        }

        if (errors && errors.length > 0) {
            errors.forEach((errorKey) => {
                showNotification({
                    title: t('notifications.errorTitle'),
                    message: t(errorKey),
                    color: 'red',
                })
            })
        }
    }, [success, errors])

    return (
        <Container size='sm' p='xl'>
            <Title order={2} mb="md">
                {t('pages.Contacts.title')}
            </Title>

            <Text mb="xl" c="dimmed">
                {t('pages.Contacts.description')}
            </Text>
            <Flex
                gap='sm'
                justify='space-evenly'
                align="flex-end"
                direction="row"
                wrap='wrap-reverse'
            >
                <Box p="sm">
                    <Stack>
                        {[
                            {
                                icon: <IconAt size={18} />,
                                title: t('pages.Contacts.contactEmail'),
                                description: 'team@kvas.pro',
                            },
                            {
                                icon: <IconPhone size={18} />,
                                title: t('pages.Contacts.contactPhone'),
                                description: '+7 (800) 335 35 35',
                            },
                            {
                                icon: <IconClockHour8 size={18} />,
                                title: t('pages.Contacts.workingHours'),
                                description: '8:00 – 20:00',
                            },
                        ].map((item, index) => (
                            <Group key={index} align="flex-start">
                                <ThemeIcon color="blue">
                                    {item.icon}
                                </ThemeIcon>
                                <Box>
                                    <Text fw={500} size="sm">
                                        {item.title}
                                    </Text>
                                    <Text size="sm">{item.description}</Text>
                                </Box>
                            </Group>
                        ))}
                    </Stack>
                </Box>

                <Box
                    bg='rgba(128, 128, 128, 0.05)'
                    p="xl"
                    style={(theme) => ({ borderRadius: theme.radius.md })}
                >
                    <Form method="post">
                        <Stack>
                            <TextInput
                                label={t('forms.emailLabel')}
                                placeholder={t('forms.emailPlaceholder')}
                                required
                                variant="filled"
                                withAsterisk
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <TextInput
                                label={t('forms.nameLabel')}
                                placeholder={t('forms.namePlaceholder')}
                                variant="filled"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <Textarea
                                label={t('forms.messageLabel')}
                                placeholder={t('forms.messagePlaceholder')}
                                minRows={4}
                                required
                                variant="filled"
                                withAsterisk
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                            />

                            <Tooltip
                                label="Собираем логи об ошибках для быстрого обнаружения и устранения возможных проблем"
                                refProp="rootRef">
                                <Checkbox
                                    label="Я согласен на обработку логов"
                                    size='xs'
                                />
                            </Tooltip>

                            <Group justify="flex-end" mt="md">
                                <Button
                                    color="blue"
                                    size="s"
                                    variant="filled"
                                    type="submit"
                                    loading={isSubmitting}
                                >
                                    {t('forms.sendButton')}
                                </Button>
                            </Group>
                        </Stack>
                    </Form>
                </Box>
            </Flex>
        </Container >
    )
}

export default Contacts
