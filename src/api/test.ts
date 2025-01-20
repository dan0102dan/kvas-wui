// /api/test.ts
import type { User, Plan } from './types'

/**
 * Эмуляция запроса "Получить пользователя по uniqueKey".
 * @param uniqueKey строка — уникальный ключ пользователя.
 * @returns Promise<User>
 */
export async function getUserByUniqueKey(uniqueKey: string): Promise<User> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (uniqueKey === 'test') {
                // Возвращаем «фейкового» пользователя
                resolve({
                    userId: 1234,
                    serviceCode: 'test-service',
                    email: 'fake@example.com',
                    uniqueKey: 'test',
                    architecture: 'x86',
                    purchaseCount: 0,
                    activationDate: '2023-01-01',
                    expirationDate: '2099-12-31',
                })
            } else {
                // Если ключ не "test", считаем, что пользователя нет
                reject(new Error('Пользователь не найден (uniqueKey != "test")'))
            }
        }, 400) // эмуляция небольшой задержки
    })
}

/**
 * Эмуляция запроса "Отправить данные на сервер".
 * @param email строка — email пользователя.
 * @param message строка — текст сообщения.
 * @returns Promise<{ success: boolean }>
 */

export async function sendEmail(email: string, message: string) {
    return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
            // 80% шанс на успех
            const isSuccess = Math.random() > 0.2
            resolve({ success: isSuccess })
        }, 2000)
    })
}

/**
 *  Запроса "Создать пользователя".
 * @param email строка — email пользователя.
 * @returns Promise<{ user: User }>
 */
export async function createUser(email: string): Promise<{ user: User }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Эмулируем создание (или получение) пользователя
            const newUser: User = {
                userId: Math.floor(Math.random() * 99999),
                uniqueKey: 'FAKE-UNIQUE-KEY-SETUP',
                serviceCode: 'test-service',
                email,
                architecture: 'x86',
                purchaseCount: 0,
                activationDate: '2023-01-01',
                expirationDate: '2099-12-31',
            }
            resolve({ user: newUser })
        }, 500)
    })
}

/**
 * "Получить" список тарифных планов.
 */
export async function getPlans(): Promise<Plan[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Эмулируем несколько тарифов
            const plans: Plan[] = [
                {
                    planId: 1,
                    name: 'Free Trial',
                    price: 0,
                    billing_cycle: 'trial',
                    features: 'Basic features, limited time',
                    type: 'freeTrial',
                },
                {
                    planId: 2,
                    name: 'Basic',
                    price: 9.99,
                    billing_cycle: 'monthly',
                    features: 'All standard features, monthly billing',
                    type: 'paid',
                },
                {
                    planId: 3,
                    name: 'Lifetime',
                    price: 199,
                    billing_cycle: 'one-time',
                    features: 'Pay once, use forever',
                    type: 'lifetime',
                },
                {
                    planId: 4,
                    name: 'Free Base',
                    price: 0,
                    billing_cycle: 'freeBase',
                    features: 'Very limited features, forever free',
                    type: 'freeBase',
                },
            ]
            resolve(plans)
        }, 300)
    })
}

/**
 * Эмуляция запроса "Отправить код подтверждения".
 * @param email строка — email пользователя.
 * @returns Promise<{ code: string }>
 */
export async function sendConfirmationCode(email: string) {
    return new Promise<{ code: string }>((resolve) => {
        setTimeout(() => {
            // Сгенерируем 4-значный код
            const code = String(Math.floor(1000 + Math.random() * 9000))
            resolve({ code })
        }, 500)
    })
}