import React, { useState, useEffect } from 'react'
import {
    ScrollArea,
    Text,
    Divider,
    Select,
    useMantineColorScheme,
    MantineColorScheme,
    Stack,
    Button,
    Group,
    Flex,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { IconRefresh, IconRocket } from '@tabler/icons-react'
import packageJson from '../../../package.json'
import { useLang, availableTranslations, Lang } from '../../contexts'
import { getLatestReleaseVersion } from '../../api/githubApi'
import { update } from '../../api/routerApi'

const AsidePanel: React.FC = () => {
    const { t, setLang, lang } = useLang()
    const { colorScheme, setColorScheme } = useMantineColorScheme()
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleUpdate = async () => {
        setIsUpdating(true)
        try {
            await update()

            showNotification({
                title: t('settings.update.started'),
                message: t('settings.update.warning'),
                color: 'blue'
            })

            setTimeout(() => {
                window.location.reload()
            }, 15000)
        } catch (err) {
            setIsUpdating(false)
            showNotification({
                title: t('settings.update.error'),
                message: (err as Error).message,
                color: 'red',
                autoClose: 5000
            })
        }
    }

    useEffect(() => {
        getLatestReleaseVersion('dan0102dan', 'kvas-wui')
            .then((version: string) => {
                setLatestVersion(version)
            })
            .catch(console.error)
    }, [])

    const isNewerVersion = (local: string, remote: string): boolean => {
        const localParts = local.split('.').map(Number)
        const remoteParts = remote.split('.').map(Number)

        for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
            const localPart = localParts[i] || 0
            const remotePart = remoteParts[i] || 0
            if (remotePart > localPart) return true
            if (remotePart < localPart) return false
        }
        return false
    }

    return (
        <ScrollArea>
            <Flex gap={8} align="flex-start" direction="column">
                <Group gap={6}>
                    <IconRocket size={16} />
                    <Text size="sm">v{packageJson.version}</Text>
                </Group>

                {latestVersion && isNewerVersion(packageJson.version, latestVersion) && (
                    <Group gap={4}>
                        <Text
                            size="xs"
                            fw={500}
                            color='dimmed'
                        >
                            {t('settings.update.available')} (v{latestVersion})
                        </Text>

                        <Button
                            size="compact-sm"
                            variant="light"
                            color="blue"
                            fullWidth
                            leftSection={<IconRefresh size={16} />}
                            onClick={handleUpdate}
                            loading={isUpdating}
                        >
                            {t('settings.update.install')}
                        </Button>
                    </Group>
                )}
            </Flex>

            <Divider my="md" variant="dashed" />

            <Stack gap="sm">
                <Text size="sm" fw={500}>
                    {t('settings.language.change')}
                </Text>
                <Select
                    data={availableTranslations.map((value) => ({
                        label: t(`settings.language.${value}`),
                        value,
                    }))}
                    value={lang}
                    onChange={(val) => val && setLang(val as Lang)}
                    comboboxProps={{ transitionProps: { transition: 'pop', duration: 100 } }}
                />
            </Stack>

            <Divider my="md" variant="dashed" />

            <Stack gap="sm">
                <Text size="sm" fw={500}>
                    {t('settings.theme.change')}
                </Text>
                <Select
                    data={[
                        { label: t('settings.theme.light'), value: 'light' },
                        { label: t('settings.theme.dark'), value: 'dark' },
                        { label: t('settings.theme.auto'), value: 'auto' },
                    ]}
                    value={colorScheme}
                    onChange={(val) => val && setColorScheme(val as MantineColorScheme)}
                    comboboxProps={{ transitionProps: { transition: 'pop', duration: 100 } }}
                />
            </Stack>
        </ScrollArea>
    )
}

export default AsidePanel