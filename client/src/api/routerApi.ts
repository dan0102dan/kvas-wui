import axios from 'axios'

export const apiClient = axios.create({
    baseURL: process.env.NODE_ENV === 'production'
        ? 'http://192.168.1.1:5000'
        : 'http://192.168.1.1:5000',
    withCredentials: false
})

export interface TunnelResponse {
    internet_gateway: {
        provider: string
        interface: string
        ip: string
        keenetic: string
        connection: boolean
    }
    tunnel: {
        name: string
        connection: boolean
        ip: string
        config: {
            server: string
            server_port: number
            local_port: number
            method: string
        }
    }
    available_networks: Array<{
        name: string
        ip?: string
        interface: string
        description?: string
        type?: string
    }>
    scanned_networks: Array<{
        name: string
        ip?: string
        interface: string
        description?: string
        type?: string
    }>
}

export const getConnections = async (): Promise<TunnelResponse> => {
    return (await apiClient.get('/tunnel')).data
}