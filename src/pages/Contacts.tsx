import React, { useState } from 'react'
import {
    Button,
    Container,
    Group,
    Flex,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
    Box,
    ThemeIcon,
    Checkbox,
    Tooltip
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { IconAt, IconPhone, IconClockHour8 } from '@tabler/icons-react'
import { useLang } from '../contexts'

// Эмуляция отправки
async function fakeSendData(email: string, message: string) {
    return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
            const isSuccess = Math.random() > 0.2
            resolve({ success: isSuccess })
        }, 2000)
    })
}

const Contacts: React.FC = () => {
    const { t } = useLang()
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const errors: string[] = []
        if (!email) errors.push('forms.errors.emailRequired')
        if (!message) errors.push('forms.errors.messageRequired')

        if (errors.length > 0) {
            errors.forEach((errKey) => {
                showNotification({
                    title: t('notifications.errorTitle'),
                    message: t(errKey),
                    color: 'red',
                })
            })
            return
        }

        setIsSending(true)
        const result = await fakeSendData(email, message)
        setIsSending(false)

        if (result.success) {
            showNotification({
                title: t('notifications.successTitle'),
                message: t('notifications.successMessage'),
                color: 'green',
            })
            // Сброс формы
            setEmail('')
            setName('')
            setMessage('')
        } else {
            showNotification({
                title: t('notifications.errorTitle'),
                message: t('notifications.errorSendFailed'),
                color: 'red',
            })
        }
    }

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
                                <ThemeIcon color="blue">{item.icon}</ThemeIcon>
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
                    <form onSubmit={handleSubmit}>
                        <Stack>
                            <TextInput
                                label={t('forms.emailLabel')}
                                placeholder={t('forms.emailPlaceholder')}
                                required
                                variant="filled"
                                withAsterisk
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextInput
                                label={t('forms.nameLabel')}
                                placeholder={t('forms.namePlaceholder')}
                                variant="filled"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Textarea
                                label={t('forms.messageLabel')}
                                placeholder={t('forms.messagePlaceholder')}
                                minRows={4}
                                required
                                variant="filled"
                                withAsterisk
                                name="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
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
                                    loading={isSending}
                                >
                                    {t('forms.sendButton')}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Box>
            </Flex>
        </Container>
    )
}

export default Contacts
