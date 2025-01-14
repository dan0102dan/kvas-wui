import { useState } from 'react'
import type { LoaderFunction, ActionFunction } from '@remix-run/node'
import { redirect, json } from '@remix-run/node'
import { Form, useLoaderData, useActionData } from '@remix-run/react'
import {
    Container,
    Title,
    Text,
    TextInput,
    Button,
    Alert,
    Stepper,
    Group,
    Box,
    Notification,
} from '@mantine/core'
import { IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react'

import { getSession, commitSession } from '~/utils/session.server' // Проверьте корректность пути
import type { UserResponse } from '~/api/licenseApi'
import { getUserByKey } from '~/api/licenseApi' // Если есть такая функция

// ===============================
// Фейковые API‑функции
// ===============================

/** 1) Проверка ошибок сервера */
async function apiCheckServerErrors(): Promise<{ hasErrors: boolean; errors?: string[] }> {
    // С вероятностью 30% возвращаем ошибки
    const hasErrors = Math.random() < 0.3
    return hasErrors
        ? { hasErrors: true, errors: ['Ошибка подключения к базе данных', 'Некорректный формат данных'] }
        : { hasErrors: false }
}

/** 2) Проверка интернет-соединения */
async function apiCheckInternet(): Promise<{ online: boolean }> {
    // Симуляция отсутствия интернета с вероятностью 20%
    const online = Math.random() >= 0.2
    return { online }
}

/** 3) Проверка инициализации (например, предварительных настроек сервера) */
async function apiCheckInitialization(): Promise<{ initialized: boolean }> {
    // Для демонстрации всегда true
    return { initialized: true }
}

/** 4) Авторизация пользователя по email и коду, возвращает данные пользователя и тип подписки */
interface AuthorizeResponse {
    user: UserResponse
    subscription: 'perpetual' | 'trial' | 'basic' | 'paid'
    expiryDate?: string
}
async function apiAuthorizeUser(email: string, code: string): Promise<AuthorizeResponse> {
    // Имитируем задержку
    await new Promise((resolve) => setTimeout(resolve, 500))
    const subscriptions: AuthorizeResponse['subscription'][] = ['perpetual', 'trial', 'basic', 'paid']
    const subscription = subscriptions[Math.floor(Math.random() * subscriptions.length)]
    const user: UserResponse = {
        userId: Math.floor(Math.random() * 100000),
        uniqueKey: 'FAKE-UNIQUE-KEY-SETUP',
        serviceCode: 'test-service',
        email,
        architecture: 'x86',
        purchaseCount: 0,
        activationDate: new Date().toISOString().split('T')[0],
        expirationDate:
            subscription === 'paid'
                ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // платная с 2 днями до окончания
                : '2099-12-31',
    }
    return { user, subscription, expiryDate: user.expirationDate }
}

/** 5) Конфигуратор начальной настройки (DNS и Интернет) */
interface ConfiguratorParams {
    dns: string
    internet: string
}
async function apiInitialConfigurator(params: ConfiguratorParams): Promise<{ success: boolean }> {
    // Имитируем задержку и всегда возвращаем успех
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('(DEBUG) Выполнена базовая настройка с параметрами:', params)
    return { success: true }
}

// ---------- Генерация кода и проверка ----------
function generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000)) // "4-значный" код
}
function verifyCode(input: string, storedCode: string) {
    return input === storedCode
}
// ---------------------------------------------------------

// Тип данных, которые храним в сессии во время Setup.
// Добавлена поддержка step 1 — email, step 2 — проверка кода, step 3 — конфигуратор.
interface SetupSessionData {
    step: 1 | 2 | 3
    email?: string
    code?: string
    // Сохраним авторизованного пользователя для дальнейшей конфигурации
    authorizedUser?: UserResponse
}

// Возможные этапы для пред‑проверок (если до стандартного процесса Setup)
type PrecheckStep = 'serverErrors' | 'offline' | 'initConfigurator'

// Тип данных, возвращаемых Loader‑функцией
interface LoaderData {
    step: PrecheckStep | 1 | 2 | 3
    error?: string | null
    errorsList?: string[]
}

// 
// Loader: проводит предварительные проверки и определяет текущий шаг процесса Setup
//
export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))

    // Если пользователь уже авторизован, перенаправляем на главную
    const user = session.get('user') as UserResponse | undefined
    if (user) {
        return redirect('/')
    }

    // 1) Проверяем наличие ошибок на сервере
    const serverCheck = await apiCheckServerErrors()
    if (serverCheck.hasErrors) {
        return json<LoaderData>(
            { step: 'serverErrors', errorsList: serverCheck.errors },
            { headers: { 'Set-Cookie': await commitSession(session) } }
        )
    }

    // 2) Проверяем интернет-соединение
    const internetStatus = await apiCheckInternet()
    if (!internetStatus.online) {
        return json<LoaderData>(
            { step: 'offline', error: 'Нет соединения с интернетом. Проверьте связь.' },
            { headers: { 'Set-Cookie': await commitSession(session) } }
        )
    }

    // 3) Проверяем, завершена ли инициализация (например, сервер готов)
    const initStatus = await apiCheckInitialization()
    if (!initStatus.initialized) {
        return json<LoaderData>(
            { step: 'initConfigurator' },
            { headers: { 'Set-Cookie': await commitSession(session) } }
        )
    }

    // 4) Если все pre-check'и пройдены, продолжаем стандартный процесс Setup
    const setupData = session.get('setupData') as SetupSessionData | undefined
    const currentStep = setupData?.step || 1

    return json<LoaderData>(
        { step: currentStep, error: session.get('setupError') || null },
        { headers: { 'Set-Cookie': await commitSession(session) } }
    )
}

//
// Action: обрабатывает отправку форм (pre-checkи, email, код, конфигуратор)
//
export const action: ActionFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))
    const formData = await request.formData()
    const actionType = formData.get('actionType')?.toString() || ''

    // Если нажата кнопка «Повторить проверку» (при отсутствии интернета)
    if (actionType === 'retry') {
        return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    // Если отправляются сведения об ошибках разработчикам
    if (actionType === 'sendErrorReport') {
        const details = formData.get('details')?.toString() || 'Без описания'
        console.log('(DEBUG) Отправка сведений разработчикам:', details)
        // Здесь можно добавить логику отправки данных на сервер
        session.set('setupError', 'Сведения успешно отправлены разработчикам')
        return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    // Получаем данные setup из сессии (по умолчанию step = 1)
    const setupData = (session.get('setupData') || {}) as SetupSessionData
    let step = setupData.step || 1
    session.unset('setupError')

    // Шаг 1: Получаем email и отправляем код
    if (step === 1) {
        const email = formData.get('email')?.toString().trim() || ''
        if (!email) {
            session.set('setupError', 'Не указан email')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        const code = generateRandomCode()
        setupData.step = 2
        setupData.email = email
        setupData.code = code
        session.set('setupData', setupData)
        console.log(`(DEBUG) Отправляем код "${code}" на почту: ${email}`)
        return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    // Шаг 2: Проверка кода и авторизация
    if (step === 2) {
        const inputCode = formData.get('code')?.toString().trim() || ''
        if (!inputCode) {
            session.set('setupError', 'Не введён код')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        const storedCode = setupData.code
        console.log(storedCode)
        const email = setupData.email
        if (!storedCode || !email) {
            session.set('setupError', 'Нет сохранённого кода или email')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        if (!verifyCode(inputCode, storedCode)) {
            session.set('setupError', 'Неверный код')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        // Выполняем авторизацию пользователя
        const authResponse = await apiAuthorizeUser(email, inputCode)
        // Для подписок trial/basic или платной с коротким сроком можно установить уведомление
        if (authResponse.subscription === 'trial' || authResponse.subscription === 'basic') {
            session.set('setupError', 'Ваша подписка бесплатная. Для расширенного функционала перейдите на платную.')
        }
        if (authResponse.subscription === 'paid' && authResponse.expiryDate) {
            const today = new Date()
            const expiry = new Date(authResponse.expiryDate)
            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24))
            if (diffDays < 3) {
                session.set('setupError', 'Срок вашей подписки подходит к концу. Рекомендуем продлить подписку.')
            }
        }
        // Переходим к шагу 3: начальный конфигуратор (DNS и Интернет)
        setupData.step = 3
        setupData.authorizedUser = authResponse.user
        session.set('setupData', setupData)
        return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    // Шаг 3: Конфигуратор — базовая настройка DNS и интернета
    if (step === 3) {
        const dns = formData.get('dns')?.toString().trim() || ''
        const internet = formData.get('internet')?.toString().trim() || ''
        if (!dns || !internet) {
            session.set('setupError', 'Заполните все поля конфигурации')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        const configResponse = await apiInitialConfigurator({ dns, internet })
        if (!configResponse.success) {
            session.set('setupError', 'Ошибка конфигурации. Попробуйте ещё раз.')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        // Извлекаем авторизованного пользователя и завершаем процесс настройки
        const authUser = setupData.authorizedUser
        if (!authUser) {
            session.set('setupError', 'Ошибка авторизации. Повторите процедуру настройки.')
            return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
        }
        session.set('user', authUser)
        session.unset('setupData')
        return redirect('/', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    // Если шаг выходит за рамки ожидаемого, сбрасываем процесс и возвращаемся к шагу 1.
    setupData.step = 1
    session.set('setupData', setupData)
    return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
}

//
// Компонент SetupPage с Stepper'ом.
// Если шаг в процессе — число (1, 2 или 3), отображаем визуальный индикатор.
// Для пред-проверок (строки 'serverErrors', 'offline', 'initConfigurator') показываем соответствующие алерты.
//
export default function SetupPage() {
    const loaderData = useLoaderData<LoaderData>()
    const actionData = useActionData<{ error?: string }>()
    const [submitting, setSubmitting] = useState(false)

    // Функция, которая ставит индикатор загрузки на кнопке при отправке формы
    const handleSubmit = () => {
        setSubmitting(true)
    }

    // Если стандартный процесс Setup (step числовой), рассчитываем текущий активный шаг для Stepper'а.
    const activeStep =
        typeof loaderData.step === 'number'
            ? loaderData.step - 1
            : -1 // если не числовой, Stepper не показываем

    return (
        <Container>
            <Title mb="lg">
                Добро пожаловать! Настройка
            </Title>

            {/* Отображение Stepper'а, если текущий шаг числовой */}
            {typeof loaderData.step === 'number' && (
                <Stepper active={activeStep} mb="xl" completedIcon={<IconCheck size={16} />}>
                    <Stepper.Step label="Email" description="Укажите ваш email" />
                    <Stepper.Step label="Подтверждение" description="Введите код" />
                    <Stepper.Step label="Конфигурация" description="Настройка DNS и интернета" />
                </Stepper>
            )}

            {/* Если этапы pre-check (строковые) — показываем алерты */}
            {loaderData.step === 'serverErrors' && loaderData.errorsList && (
                <>
                    <Alert icon={<IconX size={16} />} title="Ошибки сервера" color="red" mb="md">
                        <ul>
                            {loaderData.errorsList.map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </Alert>
                    <Form method="post" onSubmit={handleSubmit}>
                        <Text mb="sm">Прикрепите дополнительное описание (опционально):</Text>
                        <TextInput name="details" placeholder="Описание ошибки" mb="md" />
                        <Group p="right">
                            <Button type="submit" name="actionType" value="sendErrorReport" loading={submitting}>
                                Отправить сведения разработчикам
                            </Button>
                        </Group>
                    </Form>
                </>
            )}

            {loaderData.step === 'offline' && loaderData.error && (
                <>
                    <Alert icon={<IconX size={16} />} title="Отсутствие соединения" color="red" mb="md">
                        {loaderData.error}
                    </Alert>
                    <Form method="post" onSubmit={handleSubmit}>
                        <Group p="center">
                            <Button type="submit" name="actionType" value="retry" loading={submitting}>
                                Повторить проверку
                            </Button>
                        </Group>
                    </Form>
                </>
            )}

            {loaderData.step === 'initConfigurator' && (
                <Alert icon={<IconInfoCircle size={16} />} title="Инициализация" color="blue" mb="md">
                    Инициализация не завершена. Откройте конфигуратор первого запуска.
                </Alert>
            )}

            {/* Стандартный процесс Setup (step 1-3) */}
            {typeof loaderData.step === 'number' && (
                <>
                    {/* Шаг 1: Форма для ввода email */}
                    {loaderData.step === 1 && (
                        <Form method="post" onSubmit={handleSubmit}>
                            <Box mb="md">
                                <Text>Укажите ваш email</Text>
                                <TextInput
                                    name="email"
                                    placeholder="user@example.com"
                                    required
                                    mt="sm"
                                    size="md"
                                />
                            </Box>
                            <Group p="right">
                                <Button type="submit" loading={submitting}>
                                    Отправить код
                                </Button>
                            </Group>
                        </Form>
                    )}

                    {/* Шаг 2: Форма ввода кода */}
                    {loaderData.step === 2 && (
                        <Form method="post" onSubmit={handleSubmit}>
                            <Box mb="md">
                                <Text>Введите код, который мы выслали на вашу почту</Text>
                                <TextInput
                                    name="code"
                                    placeholder="Например: 1234"
                                    required
                                    mt="sm"
                                    size="md"
                                />
                            </Box>
                            <Group p="right">
                                <Button type="submit" loading={submitting}>
                                    Подтвердить
                                </Button>
                            </Group>
                        </Form>
                    )}

                    {/* Шаг 3: Форма конфигуратора (DNS и Интернет) */}
                    {loaderData.step === 3 && (
                        <Form method="post" onSubmit={handleSubmit}>
                            <Box mb="md">
                                <Text>Настройте базовые параметры:</Text>
                                <TextInput
                                    name="dns"
                                    placeholder="DNS сервер (например, 8.8.8.8)"
                                    required
                                    mt="sm"
                                    size="md"
                                />
                                <TextInput
                                    name="internet"
                                    placeholder="Тип подключения или параметры интернета"
                                    required
                                    mt="sm"
                                    size="md"
                                />
                            </Box>
                            <Group p="right">
                                <Button type="submit" loading={submitting}>
                                    Сохранить настройки
                                </Button>
                            </Group>
                        </Form>
                    )}
                </>
            )}

            {/* Отображение уведомлений об ошибках */}
            {(loaderData.error || actionData?.error) && (
                <Notification
                    icon={<IconX size={18} />}
                    color="red"
                    title="Ошибка"
                    onClose={() => { }}
                    mt="md"
                >
                    {loaderData.error}
                </Notification>
            )}

            {/* Отображение уведомлений о успешных действиях */}
            {loaderData.step === 3 && !loaderData.error && (
                <Notification
                    icon={<IconCheck size={18} />}
                    color="green"
                    title="Успех"
                    onClose={() => { }}
                    mt="md"
                >
                    Конфигурация выполнена успешно!
                </Notification>
            )}
        </Container>
    )
}
