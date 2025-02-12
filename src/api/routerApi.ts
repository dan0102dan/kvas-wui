import axios from 'axios'

export const apiClient = axios.create({
    baseURL: process.env.NODE_ENV === 'production'
        ? 'http://192.168.1.1:5000'
        : 'http://192.168.1.1:5000',
    withCredentials: false
})

interface Network {
    name: string
    ip: string
    interface: string
    description: string
}

export interface TunnelResponse {
    'internet-gateway': {
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
        domain: string
    }
    aviable_networks: Network[]
}
export const getConnections = async (): Promise<TunnelResponse> => {
    return (await apiClient.get('/tunnel')).data
}