import axios from 'axios'
import { snakeToCamel, camelToSnake } from '../utils'

// export interface UserCreatePayload {
//     serviceCode: string
//     uniqueKey: string
//     architecture: string
//     model: string
//     kvasVersion: string
// }

export interface User {
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
    userType?: 'freeTrial' | 'paid' | 'lifetime' | 'freeBase'
}
export interface Plan {
    planId: number,
    name: string,
    price: number,
    billing_cycle: string,
    features: string
}

const licenseApi = axios.create({
    baseURL: 'https://license.dnstkrv.ru/api/v1',
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


export async function getUserByKey(uniqueKey: string): Promise<User> {
    try {
        const response = await licenseApi.get<User>(`/users/${uniqueKey}`)
        return response.data
    } catch (error: any) {
        throw error
    }
}

export async function getPlans(): Promise<Plan[]> {
    try {
        const response = await licenseApi.get<Plan[]>(`/plans`)
        return response.data
    } catch (error: any) {
        throw error
    }
}