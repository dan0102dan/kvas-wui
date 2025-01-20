import React from 'react'
import {
    Box,
    ScrollArea,
    Text,
    Divider,
    Select,
    useMantineColorScheme,
    MantineColorScheme,
    Stack,
} from '@mantine/core'
import packageJson from '../../../package.json'
import { useLang, availableTranslations, Lang } from '../../contexts'

const AsidePanel: React.FC = () => {
    const { t, setLang, lang } = useLang()
    const { colorScheme, setColorScheme } = useMantineColorScheme()

    return (
        <ScrollArea style={{ height: '100%' }}>
            <Box p="md">
                <Text size="sm" c="dimmed" mb="md">
                    v{packageJson.version}
                </Text>

                <Divider mb="md" variant="dashed" />

                <Stack gap="sm" mb="md">
                    <Text size="sm" fw={600}>
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
                    <Text size="sm" fw={600}>
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
            </Box>
        </ScrollArea>
    )
}

export default AsidePanel
