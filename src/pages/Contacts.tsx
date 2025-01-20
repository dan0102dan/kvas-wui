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
    Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { showNotification } from '@mantine/notifications'
import { IconAt, IconPhone, IconClockHour8 } from '@tabler/icons-react'
import { useLang } from '../contexts'
import { sendEmail } from '../api/test'

const Contacts: React.FC = () => {
    const { t } = useLang()
    const [isSending, setIsSending] = useState(false)

    // Инициализируем Mantine form
    const form = useForm({
        initialValues: {
            email: '',
            name: '',
            message: '',
            logsConsent: false,
        },
        validate: {
            email: (value) => (value ? null : t('forms.errors.emailRequired')),
            message: (value) => (value ? null : t('forms.errors.messageRequired')),
            // name — необязательное валидация
            // logsConsent — тоже необязательное поле
        },
    })

    // Вызывается по submit формы
    const handleSubmit = async (values: typeof form.values) => {
        setIsSending(true)
        try {
            const result = await sendEmail(values.email, values.message)
            if (result.success) {
                showNotification({
                    title: t('notifications.successTitle'),
                    message: t('notifications.successMessage'),
                    color: 'green',
                })
                // Сброс формы
                form.reset()
            } else {
                showNotification({
                    title: t('notifications.errorTitle'),
                    message: t('notifications.errorMessage'),
                    color: 'red',
                })
            }
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Container size="sm" p="xl">
            <Title order={2} mb="md">
                {t('pages.Contacts.title')}
            </Title>

            <Text mb="xl" c="dimmed">
                {t('pages.Contacts.description')}
            </Text>

            <Flex
                gap="sm"
                justify="space-evenly"
                align="flex-end"
                direction="row"
                wrap="wrap-reverse"
            >
                {/* Левая колонка (контактная информация) */}
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

                {/* Правая колонка (форма) */}
                <Box
                    bg="rgba(128, 128, 128, 0.05)"
                    p="xl"
                    style={(theme) => ({ borderRadius: theme.radius.md })}
                >
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack>
                            <TextInput
                                label={t('forms.emailLabel')}
                                placeholder={t('forms.emailPlaceholder')}
                                required
                                variant="filled"
                                withAsterisk
                                type="email"
                                {...form.getInputProps('email')}
                            />

                            <TextInput
                                label={t('forms.nameLabel')}
                                placeholder={t('forms.namePlaceholder')}
                                variant="filled"
                                {...form.getInputProps('name')}
                            />

                            <Textarea
                                label={t('forms.messageLabel')}
                                placeholder={t('forms.messagePlaceholder')}
                                minRows={4}
                                required
                                variant="filled"
                                withAsterisk
                                {...form.getInputProps('message')}
                            />

                            <Tooltip
                                label="Собираем логи об ошибках для быстрого обнаружения и устранения проблем"
                                withArrow
                                p="top-start"
                                arrowOffset={8}
                            >
                                <Checkbox
                                    label="Я согласен на обработку логов"
                                    size="xs"
                                    {...form.getInputProps('logsConsent', { type: 'checkbox' })}
                                />
                            </Tooltip>

                            <Group justify="flex-end" mt="md">
                                <Button color="blue" variant="filled" type="submit" loading={isSending}>
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
