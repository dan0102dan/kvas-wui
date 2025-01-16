import { useEffect } from 'react'
import type { LoaderFunction, ActionFunction } from '@remix-run/node'
import { redirect, json } from '@remix-run/node'
import {
    Form,
    useLoaderData,
    useActionData,
} from '@remix-run/react'
import {
    Container,
    Title,
    Text,
    TextInput,
    Button,
    Stepper,
    Group,
    Box
} from '@mantine/core'
import { IconCheck, IconMailOpened } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

import { getSession, commitSession } from '~/utils/session.server'
import type { UserResponse } from '~/api/licenseApi'
import { getUserByKey } from '~/api/licenseApi'

// ===============================
// Фейковые API‑функции (эмуляция запросов)
// ===============================

/** 1) Проверка ошибок сервера */
async function apiCheckServerErrors(): Promise<{ hasErrors: boolean; error?: string }> {
    // С вероятностью 30% возвращаем ошибки
    const hasErrors = Math.random() > 0.3
    return hasErrors
        ? { hasErrors: true, error: 'Ошибка подключения к базе данных' }
        : { hasErrors: false }
}

/** 2) Проверка интернет-соединения */
async function apiCheckInternet(): Promise<{ online: boolean }> {
    // С вероятностью 20% симулируем отсутствие интернета
    const online = Math.random() >= 0.2
    return { online }
}

/** 3) Проверка инициализации сервера */
async function apiCheckInitialization(): Promise<{ initialized: boolean }> {
    // Эмуляция: всегда true
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
                ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('(DEBUG) Конфигурация с параметрами:', params)
    return { success: true }
}

/** Генерация и проверка кода */
function generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000)) // 4-значный код
}
function verifyCode(input: string, storedCode: string) {
    return input === storedCode
}

/** Проверка корректности email */
function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}

// ------------------
// Типы данных для Setup
// ------------------
interface SetupSessionData {
    step: 1 | 2 | 3 | 4
    email?: string
    code?: string
    subscriptionChoice?: 'trial' | 'basic' | 'paid'
    authorizedUser?: UserResponse
}

interface LoaderData {
    error?: string
}
interface ActionData {
    step: 1 | 2 | 3 | 4
    error?: string
}


export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))

    // Если пользователь уже авторизован, перенаправляем на главную страницу.
    if (session.get('user')) {
        return redirect('/')
    }

    // 1) Проверяем наличие ошибок на сервере.
    const serverCheck = await apiCheckServerErrors()
    if (serverCheck.hasErrors) {
        return json<LoaderData>(
            { error: serverCheck.error },
            { headers: { 'Set-Cookie': await commitSession(session) } }
        )
    }

    // 2) Проверяем интернет-соединение.
    const internetStatus = await apiCheckInternet()
    if (!internetStatus.online) {
        return json<LoaderData>(
            { error: 'Нет соединения с интернетом. Проверьте связь.' },
            { headers: { 'Set-Cookie': await commitSession(session) } }
        )
    }

    // 3) Проверяем, завершена ли инициализация.
    const initStatus = await apiCheckInitialization()
    if (!initStatus.initialized) {
        return json<LoaderData>({}, { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    const setupData = session.get('setupData') as SetupSessionData | undefined

    return json<LoaderData>(
        { error: session.get('setupError') || null },
        { headers: { 'Set-Cookie': await commitSession(session) } }
    )
}

export const action: ActionFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'))
    const formData = await request.formData()
    const actionType = String(formData.get('actionType'))

    // return json({ step: 3 })

    // Если нажата кнопка «Повторить проверку»
    if (actionType === 'retry') {
        return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    if (actionType === 'sendErrorReport') {
        return redirect('/contactus', { headers: { 'Set-Cookie': await commitSession(session) } })
    }

    const setupData = (session.get('setupData') || {}) as SetupSessionData
    let { step } = setupData
    if (!step) step = 1

    switch (step) {
        case 1: {
            // Шаг 1: Ввод email (с проверкой формата)
            const email = formData.get('email')?.toString().trim() || ''
            if (!email) {
                session.set('setupError', 'Не указан email')
                break
            }
            if (!isValidEmail(email)) {
                session.set('setupError', 'Неверный формат email')
                break
            }
            // Генерируем код и переходим к шагу 2.
            const code = generateRandomCode()
            setupData.step = 2
            setupData.email = email
            setupData.code = code
            session.set('setupData', setupData)
            console.log(`(DEBUG) Отправляем код "${code}" на почту: ${email}`)
            break
        }
        case 2: {
            // Шаг 2: Ввод кода подтверждения
            const inputCode = formData.get('code')?.toString().trim() || ''
            if (!inputCode) {
                session.set('setupError', 'Не введён код')
                break
            }
            if (!setupData.code || !setupData.email) {
                session.set('setupError', 'Нет сохранённого кода или email')
                break
            }
            if (!verifyCode(inputCode, setupData.code)) {
                session.set('setupError', 'Неверный код')
                break
            }
            // Переходим к шагу выбора подписки.
            setupData.step = 3
            session.set('setupData', setupData)
            break
        }
        case 3: {
            // Шаг 3: Выбор типа подписки
            const subscriptionChoice = formData.get('subscriptionChoice')?.toString() as 'trial' | 'basic' | 'paid' | undefined
            if (!subscriptionChoice) {
                session.set('setupError', 'Выберите тип подписки')
                break
            }
            setupData.subscriptionChoice = subscriptionChoice
            // Переходим к конфигуратору.
            setupData.step = 4
            session.set('setupData', setupData)
            break
        }
        case 4: {
            // Шаг 4: Конфигуратор — базовая настройка DNS и интернета
            const dns = formData.get('dns')?.toString().trim() || ''
            const internet = formData.get('internet')?.toString().trim() || ''
            if (!dns || !internet) {
                session.set('setupError', 'Заполните все поля конфигурации')
                break
            }
            const configResponse = await apiInitialConfigurator({ dns, internet })
            if (!configResponse.success) {
                session.set('setupError', 'Ошибка конфигурации. Попробуйте ещё раз.')
                break
            }
            // После конфигуратора выполняем авторизацию.
            const authResponse = await apiAuthorizeUser(setupData.email!, setupData.code!)
            setupData.authorizedUser = authResponse.user
            // Завершаем настройку: сохраняем авторизованного пользователя в сессии и сбрасываем setupData.
            session.set('user', authResponse.user)
            session.unset('setupData')
            return redirect('/', {
                headers: { 'Set-Cookie': await commitSession(session) },
            })
        }
        default: {
            setupData.step = 1
            session.set('setupData', setupData)
            break
        }
    }

    return redirect('/setup', { headers: { 'Set-Cookie': await commitSession(session) } })
}


export default function SetupPage() {
    const loaderData = useLoaderData<LoaderData>()
    const actionData = useActionData<ActionData>()

    useEffect(() => {
        if (loaderData?.error)
            notifications.show({
                message: loaderData.error,
                color: 'red',
            })
        if (actionData?.error)
            notifications.show({
                message: actionData.error,
                color: 'red',
            })
    }, [loaderData, actionData])

    return (
        <Container>
            {/* <Title mb="lg">Добро пожаловать! Настройка</Title> */}

            <Stepper
                active={actionData?.step || 3}
                mb="xl"
                completedIcon={<IconCheck size={16} />}
                allowNextStepsSelect={false}>
                <Stepper.Step
                    icon={<IconMailOpened size={18} />}
                    label="Step 1"
                    description="Verify email"
                >
                    <Form method="post">
                        <Box mb="md">
                            <Text>Укажите ваш email</Text>
                            <TextInput name="email" placeholder="user@example.com" required mt="sm" size="md" />
                        </Box>
                        <Group p="right">
                            <Button type="submit">
                                Отправить код
                            </Button>
                        </Group>
                    </Form>
                    <Form method="post">
                        <Box mb="md">
                            <Text>Введите код, полученный на почту</Text>
                            <TextInput name="code" placeholder="Например: 1234" required mt="sm" size="md" />
                        </Box>
                        <Group p="right">
                            <Button type="submit">
                                Подтвердить
                            </Button>
                        </Group>
                    </Form>
                </Stepper.Step>
                <Stepper.Step
                    label="Код подтверждения"
                    description="Проверьте код из email"
                />
                <Stepper.Step
                    label="Подписка"
                    description="Выберите тип подписки"
                />
                <Stepper.Step
                    label="Конфигурация"
                    description="Настройте DNS и интернет" />
            </Stepper>
        </Container>
    )
}
