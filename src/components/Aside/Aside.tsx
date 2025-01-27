import React, { useState } from 'react'
import {
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
    Alert,
    Group
} from '@mantine/core'
import packageJson from '../../../package.json'
import { useLang, availableTranslations, Lang, useSecurity } from '../../contexts'
import { IconLock, IconLockOpen, IconAlertCircle } from '@tabler/icons-react'
import styles from './Aside.module.css'

const AsidePanel: React.FC = () => {
    const { t, setLang, lang } = useLang()
    const { colorScheme, setColorScheme } = useMantineColorScheme()
    const {
        hasPassword,
        isUnlocked,
        setPassword,
        removePassword,
        logout,
    } = useSecurity()

    const [popoverOpened, setPopoverOpened] = useState(false)
    const [newPwd, setNewPwd] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)

    const handleSetPassword = () => {
        if (!newPwd) return
        setPassword(newPwd)
        setNewPwd('')
        setPopoverOpened(false)
    }

    const handleRemovePassword = () => {
        removePassword()
        setConfirmDelete(false)
        setPopoverOpened(false)
    }

    return (
        <ScrollArea>
            <Text size="sm" c="dimmed">
                v{packageJson.version}
            </Text>

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

            <Divider my="md" variant="dashed" />

            <Stack>
                {hasPassword ? (
                    <>
                        <Text size="sm" fw={500} c="dimmed">
                            {t('settings.security.active')}
                        </Text>

                        <Popover
                            opened={popoverOpened}
                            onChange={setPopoverOpened}
                            width={250}
                            position="bottom"
                        >
                            <Popover.Target>
                                <Button
                                    classNames={{ root: styles.button, label: styles.textWrap, inner: styles.inner }}
                                    variant="outline"
                                    color="gray"
                                    onClick={() => setPopoverOpened((o) => !o)}
                                >
                                    {t('settings.security.change')}
                                </Button>
                            </Popover.Target>
                            <Popover.Dropdown>
                                {confirmDelete ? (
                                    <Stack gap="sm">
                                        <Alert icon={<IconAlertCircle size={18} />} color="red">
                                            {t('settings.security.confirmRemove')}
                                        </Alert>
                                        <Group grow>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => setConfirmDelete(false)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="red"
                                                onClick={handleRemovePassword}
                                            >
                                                {t('common.confirm')}
                                            </Button>
                                        </Group>
                                    </Stack>
                                ) : (
                                    <>
                                        <Text size="sm" mb="xs">
                                            {t('settings.security.changePassword')}
                                        </Text>
                                        <TextInput
                                            type="password"
                                            value={newPwd}
                                            onChange={(e) => setNewPwd(e.target.value)}
                                            placeholder={t('settings.security.newPassword')}
                                            mb="xs"
                                        />
                                        <Button
                                            fullWidth
                                            mb="xs"
                                            onClick={handleSetPassword}
                                            disabled={!newPwd}
                                        >
                                            {t('settings.security.setNewPassword')}
                                        </Button>
                                        <Button
                                            fullWidth
                                            color="red"
                                            variant="outline"
                                            onClick={() => setConfirmDelete(true)}
                                        >
                                            {t('settings.security.removePassword')}
                                        </Button>
                                    </>
                                )}
                            </Popover.Dropdown>
                        </Popover>

                        {isUnlocked && (
                            <Button
                                classNames={{ root: styles.button, label: styles.textWrap, inner: styles.inner }}
                                variant="light"
                                color="red"
                                onClick={logout}
                                leftSection={<IconLock size={18} />}
                            >
                                {t('settings.security.logout')}
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <Text size="sm" c="dimmed">
                            {t('settings.security.inactive')}
                        </Text>
                        <Popover
                            opened={popoverOpened}
                            onChange={setPopoverOpened}
                            width={300}
                            position="bottom"
                        >
                            <Popover.Target>
                                <Button
                                    classNames={{ root: styles.button, label: styles.textWrap, inner: styles.inner }}
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconLockOpen size={18} />}
                                    onClick={() => setPopoverOpened((o) => !o)}
                                >
                                    {t('settings.security.setPassword')}
                                </Button>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <Text size="sm" mb="xs">
                                    {t('settings.security.newPassword')}
                                </Text>
                                <TextInput
                                    type="password"
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    placeholder={t('settings.security.newPasswordPlaceholder')}
                                    mb="xs"
                                />
                                <Button
                                    fullWidth
                                    onClick={handleSetPassword}
                                    disabled={!newPwd}
                                >
                                    {t('settings.security.save')}
                                </Button>
                            </Popover.Dropdown>
                        </Popover>
                    </>
                )}
            </Stack>
        </ScrollArea>
    )
}

export default AsidePanel