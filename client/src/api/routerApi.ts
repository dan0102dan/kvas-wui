import axios from 'axios'

export const apiClient = axios.create({
    baseURL: 'http://my.keenetic.net:5000',
    withCredentials: false
})

export const getConnections = async (): Promise<{
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
}> => {
    return (await apiClient.get('/tunnel')).data
}

export const update = async (): Promise<void> => (
    await apiClient.get('/update')
)

export const getSecureList = async (): Promise<string[]> => (
    (await apiClient.get('/list')).data
)
export const addDomain = async (domain: string): Promise<{ domain: string }> => (
    (await apiClient.get('/add', { params: { domain } })).data
)
export const deleteDomain = async (domain: string): Promise<{ domain: string }> => (
    (await apiClient.get('/del', { params: { domain } })).data
)
export const clearForce = async (): Promise<{ message: string; backup?: string }> => (
    (await apiClient.get('/clear')).data
)

export const getSystemStats = async (): Promise<{
    cpu: {
        usage: number
        sys: number
        user: number
        iowait: number
        steal: number
        cores: number
        idle: number
        uptimeSec: number
        load: [number, number, number]
    }
    memory: {
        free: number
        used: number
        pageCache: number
    }
    network: {
        rxSpeedBps: number
        txSpeedBps: number
        rxTotal: number
        txTotal: number
        retrans: number
        active: number
        passive: number
        fails: number
        interfaces: number
    }
    filesystem: {
        name: string
        used: number
        total: number
    }
}> => {
    return (await apiClient.get('/system-stats')).data
}