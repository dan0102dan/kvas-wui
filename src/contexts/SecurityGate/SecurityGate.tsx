import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
    Center,
    Card,
    Text,
    PasswordInput,
    Button,
    Stack,
    Group,
    Box,
    Loader,
    Flex,
    Progress
} from '@mantine/core'
import { IconLock, IconShieldLock, IconShieldCheck, IconSparkles } from '@tabler/icons-react'

interface SecurityContextValue {
    hasPassword: boolean
    isUnlocked: boolean
    setPassword: (newPwd: string) => Promise<void>
    removePassword: () => void
    logout: () => void
}

const defaultContextValue: SecurityContextValue = {
    hasPassword: false,
    isUnlocked: true,
    setPassword: async () => { },
    removePassword: () => { },
    logout: () => { },
}

const SecurityContext = createContext<SecurityContextValue>(defaultContextValue)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const [hasPassword, setHasPassword] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(true)
    const [inputValue, setInputValue] = useState('')
    const [initialized, setInitialized] = useState(false)
    const [loading, { open: startLoading, close: stopLoading }] = useDisclosure(false)

    const validatePassword = useCallback((password: string) => {
        const minLength = 8
        const hasNumber = /\d/.test(password)
        const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)

        return {
            valid: password.length >= minLength && hasNumber && hasSpecialChar,
            message: `Password must be at least ${minLength} characters with a number and special character`,
        }
    }, [])

    const checkPassword = useCallback(async (pwd: string) => {
        startLoading()
        try {
            await new Promise(resolve => setTimeout(resolve, 300))
            const storedPassword = localStorage.getItem('appPassword') || ''

            if (pwd === storedPassword) {
                setIsUnlocked(true)
                setInputValue('')
                notifications.show({
                    title: 'Access Granted',
                    message: 'Authentication successful',
                    color: 'green',
                })
                return true
            }
            throw new Error('Invalid credentials')
        } catch {
            notifications.show({
                title: 'Access Denied',
                message: 'Incorrect password',
                color: 'red',
            })
            return false
        } finally {
            stopLoading()
        }
    }, [startLoading, stopLoading])

    useEffect(() => {
        const initSecurity = async () => {
            const storedPassword = localStorage.getItem('appPassword')
            await new Promise(resolve => setTimeout(resolve, 300))

            setHasPassword(!!storedPassword)
            setIsUnlocked(!storedPassword)
            setInitialized(true)

            if (!storedPassword) {
                notifications.show({
                    title: 'Security Notice',
                    message: 'No password set. Configure one in settings.',
                    color: 'yellow',
                    icon: <IconShieldLock size={18} />,
                })
            }
        }
        initSecurity()
    }, [])

    const setPassword = useCallback(async (newPwd: string) => {
        startLoading()
        try {
            const { valid, message } = validatePassword(newPwd)
            if (!valid) throw new Error(message)

            await new Promise(resolve => setTimeout(resolve, 300))
            localStorage.setItem('appPassword', newPwd)
            setHasPassword(true)
            setIsUnlocked(false)

            notifications.show({
                title: 'Security Updated',
                message: 'New password set. Interface locked.',
                color: 'green',
                icon: <IconShieldCheck size={18} />,
            })
        } catch (error) {
            notifications.show({
                title: 'Password Error',
                message: error instanceof Error ? error.message : 'Invalid password format',
                color: 'red',
            })
            throw error
        } finally {
            stopLoading()
        }
    }, [startLoading, stopLoading, validatePassword])

    const removePassword = useCallback(() => {
        localStorage.removeItem('appPassword')
        setHasPassword(false)
        setIsUnlocked(true)
        notifications.show({
            title: 'Security Removed',
            message: 'Password protection disabled',
            color: 'yellow',
        })
    }, [])

    const logout = useCallback(() => {
        if (!hasPassword) return
        setIsUnlocked(false)
        notifications.show({
            title: 'Session Locked',
            message: 'Please authenticate to continue',
            color: 'blue',
        })
    }, [hasPassword])

    const handleUnlock = useCallback(async () => {
        await checkPassword(inputValue)
    }, [checkPassword, inputValue])

    if (!initialized) {
        return (
            <Center h="100vh" bg="dark.8">
                <Flex direction="column" align="center" gap="xl">
                    <IconSparkles
                        size={64}
                        color="var(--mantine-color-blue-5)"
                        style={{
                            animation: 'pulse 2s infinite',
                            filter: 'drop-shadow(0 0 8px rgba(77, 124, 255, 0.4))'
                        }}
                    />
                    <Loader
                        type="bars"
                        size="xl"
                        color="blue.5"
                        style={{
                            '--loader-color': 'var(--mantine-color-blue-5)'
                        }}
                    />
                    <Progress
                        value={100}
                        animated
                        striped
                        size="sm"
                        w={200}
                        color="blue"
                        style={{
                            borderRadius: 20,
                            overflow: 'hidden'
                        }}
                    />
                    <Text c="dimmed" mt="md">
                        Initializing security module...
                    </Text>
                </Flex>
            </Center>
        )
    }

    return (
        <SecurityContext.Provider
            value={{
                hasPassword,
                isUnlocked,
                setPassword,
                removePassword,
                logout,
            }}
        >
            {hasPassword && !isUnlocked ? (
                <Center h="100vh">
                    <Card w={400} p="xl" shadow="xl" radius="md" bg="dark.6">
                        <Stack gap={32}>
                            <Group justify="center" gap="xs">
                                <IconLock size={32} stroke={1.5} />
                                <Text size="xl" fw={700} ta="center">
                                    Secure Session Locked
                                </Text>
                            </Group>

                            <PasswordInput
                                label="Authentication Required"
                                placeholder="Enter your secret passphrase"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.currentTarget.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                autoFocus
                                size="md"
                                styles={{ label: { marginBottom: 12 } }}
                            />

                            <Button
                                fullWidth
                                size="md"
                                onClick={handleUnlock}
                                loading={loading}
                                loaderProps={{ type: 'dots' }}
                                leftSection={<IconLock size={18} />}
                                gradient={{ from: 'blue', to: 'cyan' }}
                                variant="gradient"
                            >
                                Unlock Access
                            </Button>
                        </Stack>
                    </Card>
                </Center>
            ) : (
                <Box style={{ position: 'relative' }}>{children}</Box>
            )}
        </SecurityContext.Provider>
    )
}

export function useSecurity() {
    return useContext(SecurityContext)
}