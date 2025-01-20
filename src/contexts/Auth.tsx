import React, { createContext, useContext, useState, useEffect } from 'react'
import { type User, getUserByKey } from '../api/licenseApi'

/**
 * Что храним в контексте
 */
export interface AuthContextProps {
    user?: User
    isLoading: boolean

    // Методы для логина/логаута (если нужны)
    login: (userData: User) => void
    logout: () => void
}

/**
 * Контекст
 */
const AuthContext = createContext<AuthContextProps>({
    user: undefined,
    isLoading: true,
    login: () => { },
    logout: () => { },
})

/**
 * Провайдер, который будет оборачивать всё приложение
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Локальный стейт для user и статуса загрузки
    const [user, setUser] = useState<User | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // 1) Сначала читаем из localStorage
        const stored = localStorage.getItem('userData')
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as User
                setUser(parsed)
                setIsLoading(false)
            } catch (err) {
                console.error('Невалидные данные пользователя в localStorage', err)
                localStorage.removeItem('userData')
                setIsLoading(false)
            }
        } else {
            // 2) Если нет в localStorage, можно сделать запрос на бэкенд (опционально)
            getUserByKey('test')
                .then((fetchedUser) => {
                    setUser(fetchedUser)
                })
                .catch(() => {
                    // Пользователь не авторизован
                })
                .finally(() => setIsLoading(false))

            // Если запрос на сервер не нужен, просто:
            setIsLoading(false)
        }
    }, [])

    /**
     * login: записывает нового пользователя в state и localStorage
     */
    const login = (userData: User) => {
        localStorage.setItem('userData', JSON.stringify(userData))
        setUser(userData)
    }

    /**
     * logout: сбрасывает пользователя
     */
    const logout = () => {
        localStorage.removeItem('userData')
        setUser(undefined)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Хук для получения контекста
 */
export function useAuth() {
    return useContext(AuthContext)
}
