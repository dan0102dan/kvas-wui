// app/routes/setup.tsx

import React, { useEffect, useState } from 'react'
import type { LoaderFunction, ActionFunction } from '@remix-run/node'
import { redirect, json } from '@remix-run/node'
import {
    Form,
    useLoaderData,
    useNavigation,
    NavLink,
} from '@remix-run/react'
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
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { Carousel } from '@mantine/carousel'

import { getSession, commitSession } from '~/utils/session.server'
import type { User, Plan } from '~/api/licenseApi'
import { getPlans } from '~/api/licenseApi'

// ===============================
// Вспомогательные API-функции (эмуляция)
// ===============================
async function apiCheckServerErrors() {
    // С вероятностью 30% возвращаем ошибку
    const hasErrors = Math.random() > 0.7
    return hasErrors
        ? { hasErrors: true, error: 'Ошибка подключения к базе данных' }
        : { hasErrors: false }
}

async function apiCheckInternet() {
    // С вероятностью 20% эмуляция отсутствия интернета
    const online = Math.random() > 0.2
    return { online }
}

async function apiCheckInitialization() {
    // Эмуляция: всегда true
    return { initialized: true }
}

async function apiAuthorizeUser(email: string, code: string) {
    // Имитируем задержку
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Случайно выбираем один из вариантов
    const possibleSubs = ['perpetual', 'trial', 'basic', 'paid'] as const
    const subscription = possibleSubs[Math.floor(Math.random() * possibleSubs.length)]
    const user: User = {
        userId: Math.floor(Math.random() * 99999),
        uniqueKey: 'FAKE-UNIQUE-KEY-SETUP',
        serviceCode: 'test-service',
        email,
        architecture: 'x86',
        purchaseCount: 0,
        activationDate: new Date().toISOString().split('T')[0],
        expirationDate:
            subscription === 'paid'
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : '2099-12-31',
    }
    return { user, subscription, expiryDate: user.expirationDate }
}

async function apiInitialConfigurator(params: { dns: string; internet: string }) {
    // «Настройка» с задержкой
    await new Promise((resolve) => setTimeout(resolve, 300))
    console.log('(DEBUG) config with params: ', params)
    return { success: true }
}

// ===============================
// Утилиты
// ===============================
function isValidEmail(email: string): boolean {
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    return re.test(email)
}
function generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000)) // 4-значный
}
function verifyCode(input: string, stored: string) {
    return input === stored
}

// ===============================
// Типы
// ===============================
interface SetupSessionData {
    step: 1 | 2 | 3
    email?: string
    code?: string
    subscriptionChoice?: string
    authorizedUser?: User
}

interface LoaderData {
    step: 1 | 2 | 3
    plans: Plan[]
    errors: string[] | null
    success: string | null
}

//
// Loader
//
export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))

    // Если пользователь уже авторизован - уходим на главную
    if (session.get('user')) {
        return redirect('/')
    }

    // Соберём ошибки
    const loaderErrors: string[] = []
    const serverCheck = await apiCheckServerErrors()
    if (serverCheck.hasErrors && serverCheck.error) {
        loaderErrors.push(serverCheck.error)
    }

    const net = await apiCheckInternet()
    if (!net.online) {
        loaderErrors.push('Нет соединения с интернетом. Проверьте связь.')
    }

    const init = await apiCheckInitialization()
    if (!init.initialized) {
        loaderErrors.push('Сервер не готов к работе. Попробуйте позже.')
    }

    // Пытаемся получить планы
    let plans: Plan[] = []
    try {
        plans = await getPlans()
    } catch (error) {
        loaderErrors.push('Не удалось загрузить тарифные планы. Попробуйте позже.')
    }

    // Если в session были зафлешены ошибки или успех — добавим их
    const flashErrors = session.get('errors') as string[] | null
    const flashSuccess = session.get('success') as string | null

    const allErrors = [...(flashErrors || []), ...loaderErrors]

    // Считываем шаг из session.setupData
    const setupData = (session.get('setupData') || {}) as SetupSessionData
    const currentStep = setupData.step || 1

    return json<LoaderData>(
        {
            step: currentStep,
            plans: plans || [],
            errors: allErrors.length ? allErrors : null,
            success: flashSuccess || null,
        },
        { headers: { 'Set-Cookie': await commitSession(session) } }
    )
}

//
// Action
//
export const action: ActionFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))
    const formData = await request.formData()
    const actionType = formData.get('actionType')?.toString() || ''

    // Если нажата кнопка «Отправить отчёт об ошибке»
    if (actionType === 'sendErrorReport') {
        return redirect('/contacts', {
            headers: { 'Set-Cookie': await commitSession(session) },
        })
    }

    // Достаём нашу «сессию» настройки
    const setupData = (session.get('setupData') || {}) as SetupSessionData
    let { step } = setupData
    if (!step) step = 1

    const errors: string[] = []

    switch (step) {
        case 1: {
            // Две кнопки: "sendCode" или "confirmCode"
            if (actionType === 'sendCode') {
                const email = (formData.get('email') || '').toString().trim()
                if (!email) errors.push('Не указан email')
                else if (!isValidEmail(email)) errors.push('Неверный формат email')

                if (errors.length > 0) {
                    // Записываем во flash
                    session.flash('errors', errors)
                    return redirect('/setup', {
                        headers: { 'Set-Cookie': await commitSession(session) },
                    })
                }

                // Генерируем код
                const code = generateRandomCode()
                setupData.email = email
                setupData.code = code
                setupData.step = 1
                session.set('setupData', setupData)

                // "Отправили" код. Можно зафлешить «Код отправлен...»
                session.flash('success', `Код отправлен на ${email}`)
                return redirect('/setup', {
                    headers: { 'Set-Cookie': await commitSession(session) },
                })
            }

            if (actionType === 'confirmCode') {
                const inputCode = (formData.get('code') || '').toString().trim()
                if (!setupData.email) errors.push('Email не задан (сессия пуста)')
                if (!setupData.code) errors.push('Код не сгенерирован')
                if (!inputCode) errors.push('Не введён код')

                if (setupData.code && inputCode && !verifyCode(inputCode, setupData.code)) {
                    errors.push('Неверный код')
                }

                if (errors.length > 0) {
                    session.flash('errors', errors)
                    return redirect('/setup', {
                        headers: { 'Set-Cookie': await commitSession(session) },
                    })
                }

                // Всё хорошо, переходим на 2 шаг
                setupData.step = 2
                session.set('setupData', setupData)
                return redirect('/setup', {
                    headers: { 'Set-Cookie': await commitSession(session) },
                })
            }

            // Если ни sendCode, ни confirmCode — просто редиректим
            return redirect('/setup', {
                headers: { 'Set-Cookie': await commitSession(session) },
            })
        }

        case 2: {
            // Пользователь кликает «Выбрать» на карточке тарифа
            const subscriptionChoice = formData.get('subscriptionChoice')?.toString()
            if (!subscriptionChoice) {
                errors.push('Не выбран тариф')
                session.flash('errors', errors)
                return redirect('/setup', {
                    headers: { 'Set-Cookie': await commitSession(session) },
                })
            }

            // Сохраняем
            setupData.subscriptionChoice = subscriptionChoice
            setupData.step = 3
            session.set('setupData', setupData)
            return redirect('/setup', {
                headers: { 'Set-Cookie': await commitSession(session) },
            })
        }

        case 3: {
            // Последний шаг — конфигуратор
            const dns = (formData.get('dns') || '').toString().trim()
            const internet = (formData.get('internet') || '').toString().trim()
            if (!dns || !internet) {
                errors.push('Заполните все поля конфигурации')
                session.flash('errors', errors)
                return redirect('/setup', {
                    headers: { 'Set-Cookie': await commitSession(session) },
                })
            }

            // Вызываем псевдо-API
            const configResponse = await apiInitialConfigurator({ dns, internet })
            if (!configResponse.success) {
                errors.push('Ошибка конфигурации')
                session.flash('errors', errors)
                return redirect('/setup', {
                    headers: { 'Set-Cookie': await commitSession(session) },
                })
            }

            if (!setupData.email || !setupData.code) {
                errors.push('Нет email или кода в сессии — странная ошибка')
                session.flash('errors', errors)
                return redirect('/setup', {
                    headers: { 'Set-Cookie': await commitSession(session) },
                })
            }

            // Авторизуем
            const authResponse = await apiAuthorizeUser(setupData.email, setupData.code)
            setupData.authorizedUser = authResponse.user
            session.set('user', authResponse.user)

            // Финал
            session.flash('success', 'Поздравляем! Установка завершена успешно.')
            session.unset('setupData')
            return redirect('/', {
                headers: { 'Set-Cookie': await commitSession(session) },
            })
        }

        default:
            // Неизвестный шаг — сбрасываем на шаг 1
            setupData.step = 1
            session.set('setupData', setupData)
            return redirect('/setup', {
                headers: { 'Set-Cookie': await commitSession(session) },
            })
    }
}

const SetupPage: React.FC = () => {
    // Достаём данные из loader
    const { step, plans, errors, success } = useLoaderData<LoaderData>()
    const navigation = useNavigation()
    const isSubmitting = navigation.state === 'submitting'

    // Локальный стейт для email и «код отправлен»
    const [email, setEmail] = useState('')
    const [codeSent, setCodeSent] = useState(false)

    // При каждом рендере, если есть errors или success, показываем уведомления
    useEffect(() => {
        if (success) {
            notifications.show({
                title: 'Успешно',
                message: success,
                c: 'green',
            })
        }
        if (errors && errors.length > 0) {
            errors.forEach((err) => {
                notifications.show({
                    title: 'Ошибка',
                    message: err,
                    c: 'red',
                })
            })
        }
    }, [success, errors])

    // Утилиты для подсветки полей (если нужно)
    const emailError = errors?.find((msg) => msg.includes('email')) || null
    const codeError = errors?.find((msg) => msg.includes('код') && !msg.includes('почту')) || null

    return (
        <Container size="md" py="xl">
            <Paper withBorder radius="md" p="md" mb="xl">
                <Title order={2} mb="xs">
                    Добро пожаловать!
                </Title>
                <Text c="dimmed" size="sm">
                    Пожалуйста, выполните несколько простых шагов, чтобы закончить инициализацию.
                </Text>
            </Paper>

            {/* Если есть ошибки — показываем дополнительный блок (по желанию) */}
            {errors && errors.length > 0 && (
                <Paper withBorder radius="md" p="md" mb="xl" style={{ backgroundc: '#fff2f2' }}>
                    <Text c="red" w={500} mb="sm">
                        Похоже, возникли ошибки
                    </Text>
                    <Text c="red" size="sm" mb="md">
                        При необходимости вы можете{' '}
                        <Form method="post" style={{ display: 'inline' }}>
                            <Button
                                type="submit"
                                name="actionType"
                                value="sendErrorReport"
                                variant="outline"
                                c="red"
                                size="xs"
                                mx={5}
                            >
                                отправить отчёт об ошибке
                            </Button>
                        </Form>
                        {' '}или повторить попытку
                    </Text>
                </Paper>
            )}

            <Paper withBorder radius="md" p="lg">
                {/* Шаги */}
                <Stepper
                    active={step - 1}
                    completedIcon={<IconCheck size={16} />}
                    allowNextStepsSelect={false}
                    mb="xl"
                >
                    {/* ШАГ 1 */}
                    <Stepper.Step label="Шаг 1" description="Email и код подтверждения">
                        <Box mb="md">
                            <Text w={500} size="sm" mb="xs">
                                1) Введите ваш email
                            </Text>
                            <Form method="post">
                                <TextInput
                                    name="email"
                                    placeholder="you@example.com"
                                    error={emailError || undefined}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        setCodeSent(false) // сбрасываем, если пользователь меняет email
                                    }}
                                />
                                <Group p="left" mt="md">
                                    <Button
                                        type="submit"
                                        name="actionType"
                                        value="sendCode"
                                        onClick={() => setCodeSent(true)}
                                        loading={!codeSent && isSubmitting}
                                    >
                                        Отправить код
                                    </Button>
                                </Group>
                            </Form>
                        </Box>

                        <Divider my="md" variant="dashed" />

                        {codeSent && (
                            <Box mb="md">
                                <Text w={500} size="sm" mb="xs">
                                    2) Введите код из письма
                                </Text>
                                <Form method="post">
                                    <TextInput
                                        name="code"
                                        placeholder="Например: 1234"
                                        error={codeError || undefined}
                                    />
                                    <Group p="left" mt="md">
                                        <Button
                                            type="submit"
                                            name="actionType"
                                            value="confirmCode"
                                            loading={isSubmitting}
                                        >
                                            Подтвердить
                                        </Button>
                                    </Group>
                                </Form>
                            </Box>
                        )}
                    </Stepper.Step>

                    {/* ШАГ 2 */}
                    <Stepper.Step label="Шаг 2" description="Выбор тарифа">
                        <Text size="sm" mb="md">
                            Ниже — список доступных планов:
                        </Text>

                        <Carousel slideSize="33.333%" slideGap="md" withIndicators loop>
                            {plans.map((plan) => (
                                <Carousel.Slide key={plan.planId}>
                                    <Card shadow="sm" radius="md" withBorder p="md">
                                        <Text w={600} size="lg">
                                            {plan.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" mt="xs">
                                            Биллинг: {plan.billing_cycle}
                                        </Text>
                                        <Text mt="xs" w={500}>
                                            Цена: {plan.price === 0 ? 'Бесплатно' : `${plan.price} $/мес`}
                                        </Text>
                                        <Text size="sm" mt="xs">
                                            {plan.features}
                                        </Text>
                                        <Form method="post">
                                            <Button
                                                type="submit"
                                                variant="light"
                                                c="blue"
                                                mt="md"
                                                fullWidth
                                                name="subscriptionChoice"
                                                value={plan.planId.toString()}
                                            >
                                                Выбрать
                                            </Button>
                                        </Form>
                                    </Card>
                                </Carousel.Slide>
                            ))}
                        </Carousel>
                    </Stepper.Step>

                    {/* ШАГ 3 */}
                    <Stepper.Step label="Шаг 3" description="Конфигурация">
                        <Box mb="md">
                            <Text w={500} size="sm" mb="xs">
                                Укажите DNS
                            </Text>
                            <Form method="post">
                                <TextInput name="dns" placeholder="8.8.8.8" mb="sm" />
                                <Text w={500} size="sm" mb="xs">
                                    Укажите интернет-провайдера
                                </Text>
                                <TextInput name="internet" placeholder="MyISP" mb="md" />
                                <Group p="right">
                                    <Button type="submit" name="actionType" value="dummyConfig">
                                        Применить настройки
                                    </Button>
                                </Group>
                            </Form>
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