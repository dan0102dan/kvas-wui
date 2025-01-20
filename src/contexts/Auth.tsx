import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../api/types'
import { getUserByUniqueKey } from '../api/test'

export interface AuthContextProps {
    user?: User
}

const AuthContext = createContext<AuthContextProps>({
    user: undefined
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | undefined>(undefined)

    useEffect(() => {
        const stored = localStorage.getItem('userData')
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as User
                setUser(parsed)
            } catch (err) {
                console.error('Невалидные данные пользователя в localStorage', err)
                localStorage.removeItem('userData')
            }
        } else {
            getUserByUniqueKey('test')
                .then((user) => {
                    setUser(user)
                    localStorage.setItem('userData', JSON.stringify(user))
                })
                .catch((err) => {
                    console.warn('Пользователь не авторизован', err.message)
                })
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
