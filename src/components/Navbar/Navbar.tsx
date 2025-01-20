import React from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, ScrollArea } from '@mantine/core'
import { routes } from '../../routes'
import { useLang } from '../../contexts'

interface NavbarProps {
    toggle: () => void
}

const Navbar: React.FC<NavbarProps> = ({ toggle }) => {
    const location = useLocation()
    const { t } = useLang()

    return (
        <>
            <ScrollArea style={{ flexGrow: 1 }}>
                {routes
                    .filter((route) => !route.hidden)
                    .map((route) => (
                        <NavLink
                            key={route.label}
                            component={RouterNavLink}
                            to={route.path}
                            label={t(`pages.${route.label}._`)}
                            leftSection={<route.icon size={20} stroke={1.5} />}
                            active={route.path === location.pathname}
                            onClick={toggle}
                            variant="light"
                        />
                    ))}
            </ScrollArea>
        </>
    )
}

export default Navbar
