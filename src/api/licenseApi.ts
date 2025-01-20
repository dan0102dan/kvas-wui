import axios from 'axios'
import type { User, Plan } from './types'
import { snakeToCamel, camelToSnake } from '../utils'

const licenseApi = axios.create({
    baseURL: 'https://license.dnstkrv.ru/api/v1',
})

// Interceptors
licenseApi.interceptors.request.use((config) => {
    if (config.data) {
        config.data = camelToSnake(config.data)
    }
    return config
}, (error) => Promise.reject(error))

licenseApi.interceptors.response.use((response) => {
    if (response.data) {
        response.data = snakeToCamel(response.data)
    }
    return response
}, (error) => Promise.reject(error))

export async function getUserByKey(uniqueKey: string): Promise<User> {
    const response = await licenseApi.get<User>(`/users/${uniqueKey}`)
    return response.data
}

export async function getPlans(): Promise<Plan[]> {
    const response = await licenseApi.get<Plan[]>(`/plans`)
    return response.data
}
