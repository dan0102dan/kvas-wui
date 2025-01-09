import axios from 'axios'

export interface UserCreatePayload {
    serviceCode: string
    email: string
    uniqueKey: string
    architecture: string
    purchaseCount: number
}

export interface UserResponse {
    uniqueKey: string
    email: string
    activationDate: string
    userId: number
    serviceCode: string
    userType: 'free' | 'paid' | 'lifetime' | 'other'
    purchaseCount: number
    expirationDate: string
}

const licenseApi = axios.create({
    baseURL: 'https://license.dnstkrv.ru',
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

export async function createUser(payload: UserCreatePayload): Promise<UserResponse> {
    const response = await licenseApi.post<UserResponse>('/users/', payload)
    return response.data
}
