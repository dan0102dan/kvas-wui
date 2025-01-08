import React, { createContext, useState, ReactNode, useContext } from 'react'

interface AuthType {
    isAuthenticated: boolean
    token: string | null
    login: (token: string) => void
    logout: () => void
}

const Auth = createContext<AuthType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
    const [token, setToken] = useState<string | null>(null)

    const login = (token: string) => {
        setIsAuthenticated(true)
        setToken(token)
        // Можно сохранить токен в localStorage или cookies
    }

    const logout = () => {
        setIsAuthenticated(true)
        setToken(null)
        // Удалить токен из localStorage или cookies
    }

    return (
        <Auth.Provider value={{ isAuthenticated, token, login, logout }}>
            {children}
        </Auth.Provider>
    )
}

export const useAuth = (): AuthType => {
    const context = useContext(Auth)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
