import React, { createContext, useContext, ReactNode } from 'react'
import type { User } from '../api/licenseApi'

export interface AuthContextProps {
    user: User | undefined
}

interface AuthProviderProps extends AuthContextProps {
    children: ReactNode
}

const AuthContext = createContext<AuthContextProps>({ user: undefined })

export function AuthProvider({ user, children }: AuthProviderProps) {
    return (
        <AuthContext.Provider value={{ user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
