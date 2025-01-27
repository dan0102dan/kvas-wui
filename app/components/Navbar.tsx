import React from 'react'
import { NavLink as RemixNavLink, useLocation } from '@remix-run/react'
import {
    IconSun,
    IconSwitchHorizontal,
} from '@tabler/icons-react'
import { NavLink, ScrollArea, Popover, Select, useMantineColorScheme, MantineColorScheme } from '@mantine/core'
import { useLang, availableTranslations, Lang } from '../contexts'
import { routes } from '../routes/routes'

interface NavbarProps {
    toggle: () => void
}

const Navbar: React.FC<NavbarProps> = ({ toggle }) => {
    const { t, setLang } = useLang()
    const { colorScheme, setColorScheme } = useMantineColorScheme()
    const location = useLocation()

    return (
        <>
            <ScrollArea style={{ flexGrow: 1 }}>
                {routes
                    .filter((route) => route.path !== '*')
                    .map((route) => (
                        <NavLink
                            key={route.label}
                            component={RemixNavLink}
                            to={route.path}
                            label={t(`pages.${route.label}._`)}
                            leftSection={<route.icon size={20} stroke={1.5} />}
                            active={route.path === location.pathname}
                            onClick={toggle}
                            variant="light"
                        />
                    ))}
            </ScrollArea>

            <>
                <Popover
                    trapFocus
                    withArrow arrowPosition="side" arrowOffset={12}
                    shadow="md"
                    position="top-start"
                >
                    <Popover.Target>
                        <NavLink
                            label={t('settings.language.change')}
                            leftSection={<IconSwitchHorizontal size={20} stroke={1.5} />}
                        />
                    </Popover.Target>
                    <Popover.Dropdown>
                        <Select
                            dropdownOpened
                            withCheckIcon
                            checkIconPosition='right'
                            data={availableTranslations.map((e) => ({ label: t(`settings.language.${e}`), value: e }))}
                            placeholder={t('settings.language.placeholder')}
                            comboboxProps={{ withinPortal: false, position: 'top', offset: 0 }}
                            onChange={(e) => e && setLang(e as Lang)}
                        />
                    </Popover.Dropdown>
                </Popover>

                <Popover
                    trapFocus
                    withArrow
                    arrowPosition="side"
                    arrowOffset={12}
                    shadow="md"
                    position="top-start"
                >
                    <Popover.Target>
                        <NavLink
                            label={t('settings.theme.change')}
                            leftSection={<IconSun size={20} stroke={1.5} />}
                        />
                    </Popover.Target>
                    <Popover.Dropdown>
                        <Select
                            dropdownOpened
                            withCheckIcon
                            checkIconPosition='right'
                            data={[
                                { label: t('settings.theme.light'), value: 'light' },
                                { label: t('settings.theme.dark'), value: 'dark' },
                                { label: t('settings.theme.auto'), value: 'auto' },
                            ]}
                            value={colorScheme}
                            comboboxProps={{ withinPortal: false, position: 'top', offset: 0 }}
                            onChange={(e) => e && setColorScheme(e as MantineColorScheme)}
                        />
                    </Popover.Dropdown>
                </Popover>
            </>
        </>
    )
}

export default Navbar
