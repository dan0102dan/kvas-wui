/**
 * Интерфейс, описывающий поля создаваемого пользователя (POST /users).
 * Можно подставить нужные типы вместо string, если они известны более точно.
 */
export interface IUserCreatePayload {
    service_code: string
    email: string
    unique_key: string
    architecture: string
    count_of_purchases: number
}

/**
 * Интерфейс ответа от API (GET /users/:unique_key).
 * Важно, чтобы поля совпадали с реальными полями ответа API.
 */
export interface IUserResponse {
    unique_key: string
    email: string
    activation_date: string
    user_id: number
    service_code: string
    type: 'free' | 'paid' | 'lifetime' | 'otherPossibleTypes'
    count_of_purchases: number
    expiration_date: string
}
