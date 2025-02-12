import React from 'react'
import {
    ScrollArea,
    Text,
    Divider,
    Select,
    useMantineColorScheme,
    MantineColorScheme,
    Stack
} from '@mantine/core'
import packageJson from '../../../package.json'
import { useLang, availableTranslations, Lang } from '../../contexts'

const AsidePanel: React.FC = () => {
    const { t, setLang, lang } = useLang()
    const { colorScheme, setColorScheme } = useMantineColorScheme()

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
        </ScrollArea>
    )
}

export default AsidePanel