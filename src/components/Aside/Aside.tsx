import React, { useState } from 'react'
import {
    Box,
    ScrollArea,
    Text,
    Divider,
    Select,
    useMantineColorScheme,
    MantineColorScheme,
    Stack,
    Popover,
    TextInput,
    Button,
} from '@mantine/core'
import packageJson from '../../../package.json'
import { useLang, availableTranslations, Lang, useSecurity } from '../../contexts'
import { IconLock, IconLockOpen } from '@tabler/icons-react'

const AsidePanel: React.FC = () => {
    const { t, setLang, lang } = useLang()
    const { colorScheme, setColorScheme } = useMantineColorScheme()

    // Логика защиты
    const {
        hasPassword,
        isUnlocked,
        setPassword,
        removePassword,
        logout,
    } = useSecurity()

    // Локальные состояния для Popover
    const [popoverOpened, setPopoverOpened] = useState(false)
    const [newPwd, setNewPwd] = useState('')

    const handleSetPassword = () => {
        setPassword(newPwd)
        setNewPwd('')
        setPopoverOpened(false)
    }

    const handleRemovePassword = () => {
        removePassword()
        setPopoverOpened(false)
    }

    return (
        <ScrollArea>
            <Box p="md">
                <Text size="sm" c="dimmed" mb="md">
                    v{packageJson.version}
                </Text>

                <Divider mb="md" variant="dashed" />

                <Stack gap="sm" mb="md">
                    <Text size="sm" fw={500}>
                        {t('settings.language.change')}
                    </Text>
                    <Select
                        data={availableTranslations.map((lng) => ({
                            label: t(`settings.language.${lng}`),
                            value: lng,
                        }))}
                        value={lang}
                        onChange={(val) => val && setLang(val as Lang)}
                        comboboxProps={{ transitionProps: { transition: 'pop', duration: 100 } }}
                    />
                </Stack>

                <Divider mb="md" variant="dashed" />

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

                <Divider mt="md" mb="md" />

                {/* Блок управления паролем */}
                <Stack>
                    {hasPassword ? (
                        <>
                            <Text size="sm" fw={500} c="dimmed">
                                Интерфейс защищён паролем
                            </Text>

                            <Popover
                                opened={popoverOpened}
                                onChange={setPopoverOpened}
                                width={250}
                                position="bottom"
                            >
                                <Popover.Target>
                                    <Button
                                        variant="outline"
                                        color="gray"
                                        onClick={() => setPopoverOpened((o) => !o)}
                                    >
                                        {t('security.changeOrRemove')}
                                    </Button>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <Text size="sm" w={500} mb="xs">
                                        {t('security.changePassword')}
                                    </Text>
                                    <TextInput
                                        type="password"
                                        value={newPwd}
                                        onChange={(e) => setNewPwd(e.target.value)}
                                        placeholder={t('security.newPassword')}
                                        mb="xs"
                                    />
                                    <Button
                                        fullWidth
                                        mb="xs"
                                        onClick={handleSetPassword}
                                    >
                                        {t('security.setNewPassword')}
                                    </Button>
                                    <Button
                                        fullWidth
                                        color="red"
                                        variant="outline"
                                        onClick={handleRemovePassword}
                                    >
                                        {t('security.removePassword')}
                                    </Button>
                                </Popover.Dropdown>
                            </Popover>

                            {isUnlocked && (
                                <Button
                                    variant="light"
                                    color="red"
                                    onClick={logout}
                                    leftSection={<IconLock />}
                                >
                                    {t('security.logout')}
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Text size="sm" c="dimmed">
                                Интерфейс не защищён паролем
                            </Text>
                            {/* Кнопка установить пароль */}
                            <Popover
                                opened={popoverOpened}
                                onChange={setPopoverOpened}
                                width={250}
                                position="bottom"
                            >
                                <Popover.Target>
                                    <Button
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconLockOpen />}
                                        onClick={() => setPopoverOpened((o) => !o)}
                                    >
                                        {t('security.setPassword')}
                                    </Button>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <Text size="sm" w={500} mb="xs">
                                        {t('security.newPassword')}
                                    </Text>
                                    <TextInput
                                        type="password"
                                        value={newPwd}
                                        onChange={(e) => setNewPwd(e.target.value)}
                                        placeholder={t('security.newPasswordPlaceholder')}
                                        mb="xs"
                                    />
                                    <Button
                                        fullWidth
                                        onClick={handleSetPassword}
                                    >
                                        {t('security.save')}
                                    </Button>
                                </Popover.Dropdown>
                            </Popover>
                        </>
                    )}
                </Stack>
            </Box>
        </ScrollArea>
    )
}

export default AsidePanel