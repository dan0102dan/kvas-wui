import React, { createContext, useContext, ReactNode } from 'react'
import type { UserResponse } from '../api/licenseApi'

export interface AuthContextProps {
    user: UserResponse | undefined
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
