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
    Card
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Carousel } from '@mantine/carousel'
import { IconCheck } from '@tabler/icons-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { getPlans, Plan, User } from '../api/licenseApi'
import { useAuth } from '../contexts'

function fakeSendCode(email: string) {
    return new Promise<{ code: string }>((resolve) => {
        setTimeout(() => {
            // Сгенерируем 4-значный
            const code = String(Math.floor(1000 + Math.random() * 9000))
            resolve({ code })
        }, 500)
    })
}

function fakeCheckCode(inputCode: string, realCode: string) {
    return inputCode === realCode
}

function fakeInitConfig(dns: string, internet: string) {
    return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
            resolve({ success: true })
        }, 300)
    })
}

function fakeAuthorizeUser(email: string, code: string): Promise<{ user: User }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Эмуляция
            const user: User = {
                userId: Math.floor(Math.random() * 99999),
                uniqueKey: 'FAKE-UNIQUE-KEY-SETUP',
                serviceCode: 'test-service',
                email,
                architecture: 'x86',
                purchaseCount: 0,
                activationDate: '2023-01-01',
                expirationDate: '2099-12-31',
            }
            resolve({ user })
        }, 500)
    })
}

const SetupPage: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [plans, setPlans] = useState<Plan[]>([])
    const [step, setStep] = useState<number>(1)

    // Шаг 1
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [realCode, setRealCode] = useState<string | null>(null)

    // Шаг 2
    const [subscriptionChoice, setSubscriptionChoice] = useState<string | null>(null)

    // Шаг 3
    const [dns, setDns] = useState('')
    const [internet, setInternet] = useState('')

    // Если user уже авторизован, смысла в setup нет
    useEffect(() => {
        if (user) {
            navigate('/')
        }
    }, [user])

    // Загружаем тарифы (аналог loader)
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

    // Шаг 1 - отправить код
    const handleSendCode = async () => {
        if (!email) {
            notifications.show({
                title: 'Ошибка',
                message: 'Не указан email',
                color: 'red',
            })
            return
        }

        // Генерируем код
        const resp = await fakeSendCode(email)
        setRealCode(resp.code)
        notifications.show({
            title: 'Успешно',
            message: `Код отправлен на ${email}`,
            color: 'green',
        })
    }

    // Шаг 1 - подтвердить код
    const handleConfirmCode = async () => {
        if (!realCode) {
            notifications.show({
                title: 'Ошибка',
                message: 'Сначала нажмите "Отправить код"',
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
        // всё ок
        setStep(2)
    }

    // Шаг 2 - выбрать тариф
    const handleSelectPlan = (planId: number) => {
        setSubscriptionChoice(planId.toString())
        setStep(3)
    }

    // Шаг 3 - конфиг
    const handleApplyConfig = async () => {
        if (!dns || !internet) {
            notifications.show({
                title: 'Ошибка',
                message: 'Заполните все поля конфигурации',
                color: 'red',
            })
            return
        }

        const confRes = await fakeInitConfig(dns, internet)
        if (!confRes.success) {
            notifications.show({
                title: 'Ошибка',
                message: 'Ошибка конфигурации',
                color: 'red',
            })
            return
        }

        // Авторизация
        if (!realCode) {
            notifications.show({
                title: 'Ошибка',
                message: 'Нет кода в памяти (странная ошибка).',
                color: 'red',
            })
            return
        }
        const authResp = await fakeAuthorizeUser(email, realCode)
        // Сохраняем user где-то (localStorage?), перезагружаем/редирект
        localStorage.setItem('userData', JSON.stringify(authResp.user))
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
                <Stepper
                    active={step - 1}
                    completedIcon={<IconCheck size={16} />}
                    allowNextStepsSelect={false}
                    mb="xl"
                >
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
                                <Button onClick={handleSendCode}>
                                    Отправить код
                                </Button>
                            </Group>
                        </Box>

                        <Divider my="md" variant="dashed" />

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
                                <Button onClick={handleConfirmCode}>
                                    Подтвердить
                                </Button>
                            </Group>
                        </Box>
                    </Stepper.Step>

                    <Stepper.Step label="Шаг 2" description="Выбор тарифа">
                        <Text size="sm" mb="md">
                            Ниже — список доступных планов:
                        </Text>

                        <Carousel slideSize="33.333%" slideGap="md" withIndicators loop>
                            {plans.map((plan) => (
                                <Carousel.Slide key={plan.planId}>
                                    <Card shadow="sm" radius="md" withBorder p="md">
                                        <Text fw={600} size="lg">
                                            {plan.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" mt="xs">
                                            Биллинг: {plan.billing_cycle}
                                        </Text>
                                        <Text mt="xs">
                                            Цена: {plan.price === 0 ? 'Бесплатно' : `${plan.price} $/мес`}
                                        </Text>
                                        <Text size="sm" mt="xs">
                                            {plan.features}
                                        </Text>
                                        <Button
                                            variant="light"
                                            color="blue"
                                            mt="md"
                                            fullWidth
                                            onClick={() => handleSelectPlan(plan.planId)}
                                        >
                                            Выбрать
                                        </Button>
                                    </Card>
                                </Carousel.Slide>
                            ))}
                        </Carousel>
                    </Stepper.Step>

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
                            <Group position="right">
                                <Button onClick={handleApplyConfig}>
                                    Применить настройки
                                </Button>
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
