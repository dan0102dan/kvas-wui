import React, { useEffect, useState } from 'react'
import {
    Container,
    Text,
    TextInput,
    Button,
    Stepper,
    Group,
    Box,
    Paper,
    Title,
    Divider,
    Anchor,
    Card,
    Stack
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Carousel } from '@mantine/carousel'
import { IconCheck } from '@tabler/icons-react'
import { NavLink, useNavigate } from 'react-router-dom'

import type { Plan } from '../api/types'
import { createUser, getPlans, sendConfirmationCode } from '../api/test'
import { useAuth } from '../contexts'

/** Сравнение введённого кода с "реальным" */
function fakeCheckCode(inputCode: string, realCode: string) {
    return inputCode === realCode
}

/** Псевдо-настройка (DNS, провайдер) */
function fakeInitConfig(dns: string, internet: string) {
    return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
            resolve({ success: true })
        }, 300)
    })
}

const SetupPage: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // Три шага мастера. Начинаем с шага 0 (чтобы Stepper был в состоянии "Шаг 1")
    const [step, setStep] = useState<number>(0)

    // Шаг 1
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [realCode, setRealCode] = useState<string | null>(null)

    // Шаг 2
    const [plans, setPlans] = useState<Plan[]>([])
    const [subscriptionChoice, setSubscriptionChoice] = useState<string | null>(null)

    // Шаг 3
    const [dns, setDns] = useState('')
    const [internet, setInternet] = useState('')

    // Если пользователь уже авторизован, нет смысла проходить setup
    // useEffect(() => {
    //     if (user) {
    //         navigate('/')
    //     }
    // }, [user, navigate])

    // Загружаем тарифные планы при монтировании
    useEffect(() => {
        getPlans()
            .then((res) => {
                setPlans(res)
            })
            .catch((err) => {
                console.error(err)
                notifications.show({
                    title: 'Ошибка',
                    message: 'Не удалось загрузить тарифные планы.',
                    color: 'red',
                })
            })
    }, [])

    // Если пользователь меняет email, сбрасываем код и "реальный код"
    useEffect(() => {
        setRealCode(null)
        setCode('')
    }, [email])

    /** Шаг 1 — отправка кода */
    const handleSendCode = async () => {
        if (!email) {
            notifications.show({
                title: 'Ошибка',
                message: 'Не указан email',
                color: 'red',
            })
            return
        }

        const { code } = await sendConfirmationCode(email)
        console.log(code)
        setRealCode(code) // Устанавливаем "реальный" код (теперь можно вводить и подтверждать)

        notifications.show({
            title: 'Успешно',
            message: `Код отправлен на ${email}`,
            color: 'green',
        })
    }

    /** Шаг 1 — подтверждение кода */
    const handleConfirmCode = async () => {
        if (!realCode) {
            notifications.show({
                title: 'Ошибка',
                message: 'Сначала нажмите «Отправить код»',
                color: 'red',
            })
            return
        }
        if (!code) {
            notifications.show({
                title: 'Ошибка',
                message: 'Не введён код',
                color: 'red',
            })
            return
        }
        if (!fakeCheckCode(code, realCode)) {
            notifications.show({
                title: 'Ошибка',
                message: 'Неверный код',
                color: 'red',
            })
            return
        }
        // Код верный — переходим на 2-й шаг
        setStep(1)
    }

    /** Шаг 2 — выбор тарифа */
    const handleSelectPlan = (planId: number) => {
        setSubscriptionChoice(planId.toString())
        setStep(2)
    }

    /** Шаг 3 — конфигурация и создание пользователя */
    const handleApplyConfig = async () => {
        if (!dns || !internet) {
            notifications.show({
                title: 'Ошибка',
                message: 'Заполните поля DNS и интернет-провайдера',
                color: 'red',
            })
            return
        }

        // Псевдо-настройка
        const confRes = await fakeInitConfig(dns, internet)
        if (!confRes.success) {
            notifications.show({
                title: 'Ошибка',
                message: 'Ошибка конфигурации',
                color: 'red',
            })
            return
        }

        // Создаём пользователя через заглушку createUser(...)
        if (!realCode) {
            notifications.show({
                title: 'Ошибка',
                message: 'Нет кода в памяти (странная ошибка).',
                color: 'red',
            })
            return
        }

        const authResp = await createUser(email)
        const newUser = authResp.user

        // Сохраняем user в localStorage (или используем login() из AuthContext)
        localStorage.setItem('userData', JSON.stringify(newUser))

        notifications.show({
            title: 'Успешно',
            message: 'Поздравляем! Установка завершена.',
            color: 'green',
        })
        navigate('/')
    }

    return (
        <Container size="md" py="xl">
            <Paper withBorder radius="md" p="md" mb="xl">
                <Title order={2} mb="xs">
                    Добро пожаловать!
                </Title>
                <Text c="dimmed" size="sm">
                    Пожалуйста, выполните несколько шагов, чтобы закончить инициализацию.
                </Text>
            </Paper>

            <Paper withBorder radius="md" p="lg">
                {/**
         * Мапим step: 0 -> (Этап "Email и код"),
         *             1 -> (Выбор тарифа),
         *             2 -> (Конфигурация).
         * Mantine Stepper "active" — это текущее число шага.
         */}
                <Stepper
                    active={step}
                    completedIcon={<IconCheck size={16} />}
                    allowNextStepsSelect={false}
                    mb="xl"
                >
                    {/* ШАГ 1 */}
                    <Stepper.Step label="Шаг 1" description="Email и код">
                        <Box mb="md">
                            <Text size="sm" mb="xs">
                                1) Введите ваш email
                            </Text>
                            <TextInput
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Group mt="md">
                                <Button onClick={handleSendCode}>Отправить код</Button>
                            </Group>
                        </Box>

                        <Divider my="md" variant="dashed" />

                        {/* Показываем поле "Введите код" и кнопку "Подтвердить", только если realCode != null */}
                        {realCode !== null && (
                            <Box mb="md">
                                <Text size="sm" mb="xs">
                                    2) Введите код из письма
                                </Text>
                                <TextInput
                                    placeholder="1234"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                                <Group mt="md">
                                    <Button onClick={handleConfirmCode}>Подтвердить</Button>
                                </Group>
                            </Box>
                        )}
                    </Stepper.Step>

                    {/* ШАГ 2 */}
                    <Stepper.Step label="Шаг 2" description="Выбор тарифа">
                        <Text size="sm" mb="md">
                            Список доступных планов:
                        </Text>

                        <Carousel
                            slideSize="25%"         // 4 карточки на 100%
                            slideGap="md"
                            align="start"           // выравнивание слайда сверху
                        >
                            {plans.map((plan) => (
                                <Carousel.Slide key={plan.planId}>
                                    <Card
                                        shadow="sm"
                                        radius="md"
                                        withBorder
                                        p="md"
                                        h='100%'
                                    >
                                        <Stack flex={1}>
                                            <Title order={4}>{plan.name}</Title>
                                            <Text size="sm" c="dimmed">
                                                Биллинг: {plan.billing_cycle}
                                            </Text>
                                            <Text size="sm">
                                                Цена:{' '}
                                                {plan.price === 0
                                                    ? 'Бесплатно'
                                                    : `${plan.price} $/мес`}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                {plan.features}
                                            </Text>
                                        </Stack>

                                        <Button
                                            variant="filled"
                                            color="blue"
                                            mt="md"
                                            onClick={() => handleSelectPlan(plan.planId)}
                                        >
                                            Выбрать
                                        </Button>
                                    </Card>
                                </Carousel.Slide>
                            ))}
                        </Carousel>
                    </Stepper.Step>

                    {/* ШАГ 3 */}
                    <Stepper.Step label="Шаг 3" description="Конфигурация">
                        <Box mb="md">
                            <Text size="sm" mb="xs">
                                Укажите DNS
                            </Text>
                            <TextInput
                                placeholder="8.8.8.8"
                                mb="sm"
                                value={dns}
                                onChange={(e) => setDns(e.target.value)}
                            />
                            <Text size="sm" mb="xs">
                                Укажите интернет-провайдера
                            </Text>
                            <TextInput
                                placeholder="MyISP"
                                mb="md"
                                value={internet}
                                onChange={(e) => setInternet(e.target.value)}
                            />
                            <Group p="right">
                                <Button onClick={handleApplyConfig}>Применить настройки</Button>
                            </Group>
                        </Box>
                    </Stepper.Step>
                </Stepper>

                <Box mt="xl">
                    <Text c="dimmed" size="sm">
                        По вопросам обращайтесь в{' '}
                        <Anchor component={NavLink} to="/contacts">
                            службу поддержки
                        </Anchor>
                        .
                    </Text>
                </Box>
            </Paper>
        </Container>
    )
}

export default SetupPage
