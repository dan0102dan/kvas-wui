import axios from 'axios'
import { snakeToCamel, camelToSnake } from '../utils'

// export interface UserCreatePayload {
//     serviceCode: string
//     uniqueKey: string
//     architecture: string
//     model: string
//     kvasVersion: string
// }

export interface UserResponse {
    userId: number
    serviceCode: string
    email: string | null
    uniqueKey: string
    architecture: string
    model?: string
    kvasVersion?: string
    purchaseCount: number
    subscriptionType?: string[]
    activationDate: string
    expirationDate: string
    subscriptionIds?: number[]
    userType?: 'free' | 'paid' | 'lifetime' | 'other'
}

const licenseApi = axios.create({
    baseURL: 'https://license.dnstkrv.ru',
})

// Request interceptor для конвертации camelCase в snake_case
licenseApi.interceptors.request.use(config => {
    if (config.data) {
        config.data = camelToSnake(config.data)
    }
    return config
}, error => {
    return Promise.reject(error)
})
// Response interceptor для конвертации snake_case в camelCase
licenseApi.interceptors.response.use(response => {
    if (response.data) {
        response.data = snakeToCamel(response.data)
    }
    return response
}, error => {
    return Promise.reject(error)
})


export async function getUserByKey(uniqueKey: string): Promise<UserResponse | null> {
    try {
        const response = await licenseApi.get<UserResponse>(`/users/${uniqueKey}`)
        return response.data
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null
        }
        throw error
    }
}