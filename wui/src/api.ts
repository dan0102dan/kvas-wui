import axios from 'axios'

export interface LoginResponse {
    success: boolean
    token?: string
    message?: string
}

// Провайдеры услуг
export interface ServiceProvider {
    id: string
    name: string
    description: string
}

// Настройки VPN
export interface VPNSettings {
    providerId: string
    server: string
    protocol: string
}

// Настройки DNS
export interface DNSSettings {
    primary: string
    secondary: string
}

// Статус интернета
export interface InternetStatus {
    isAvailable: boolean
    speedMbps?: number
}

// Отладка
export interface DebugProblem {
    description: string
    attachLogs: boolean
}

const baseURL = 'http://localhost:49301'

export const server = axios.create({
    baseURL,
    headers: {
        authorization: 'key', // замените на реальный ключ или метод авторизации
    },
})

// Методы авторизации
export const login = async (password: string): Promise<LoginResponse> => {
    const response = await server.post('/login', { password })
    return response.data
}

export const createPassword = async (password: string): Promise<LoginResponse> => {
    const response = await server.post('/create-password', { password })
    return response.data
}

// Методы для главной страницы
export const getProjectInfo = async () => {
    const response = await server.get('/project-info')
    return response.data
}

// Методы для настроек
export const getServiceProviders = async (): Promise<ServiceProvider[]> => {
    const response = await server.get('/service-providers')
    return response.data
}

export const configureVPN = async (settings: VPNSettings) => {
    const response = await server.post('/configure-vpn', settings)
    return response.data
}

export const configureDNS = async (settings: DNSSettings) => {
    const response = await server.post('/configure-dns', settings)
    return response.data
}

export const checkInternetStatus = async (): Promise<InternetStatus> => {
    const response = await server.get('/internet-status')
    return response.data
}

// Методы для отладки
export const submitDebugProblem = async (problem: DebugProblem) => {
    const response = await server.post('/debug-problem', problem)
    return response.data
}
