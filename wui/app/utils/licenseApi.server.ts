import axios from 'axios'
import type { IUserCreatePayload, IUserResponse } from './types'

const api = axios.create({
    baseURL: 'https://license.dnstkrv.ru',
})

export default api

/**
 * Получает данные пользователя по уникальному ключу.
 * Если вернется 404 — значит пользователя нет.
 */
export async function getUserByKey(uniqueKey: string): Promise<IUserResponse | null> {
    try {
        const response = await api.get<IUserResponse>(`/users/${uniqueKey}`)
        return response.data
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null
        }
        throw error
    }
}

/**
 * Создает нового пользователя.
 */
export async function createUser(payload: IUserCreatePayload): Promise<IUserResponse> {
    const response = await api.post<IUserResponse>('/users/', payload)
    return response.data
}
