import { IconInfoSquareRounded, IconFileText, IconCloudDataConnection, IconError404 } from '@tabler/icons-react'
import About from './pages/About'
import Tunnel from './pages/Tunnel'
import SecureList from './pages/SecureList'
import NotFound from './pages/NotFound'

export interface Route {
    path: string
    label: string
    icon: React.ElementType
    element: React.ReactNode
    hidden?: boolean
}

export const routes: Route[] = [
    {
        path: 'secureList',
        label: 'SecureList',
        icon: IconFileText,
        element: <SecureList />,
    },
    {
        path: 'tunnel',
        label: 'Tunnel',
        icon: IconCloudDataConnection,
        element: <Tunnel />,
    },
    {
        path: '*',
        label: 'NotFound',
        icon: IconError404,
        element: <NotFound />,
        hidden: true,
    },
    {
        path: '/',
        label: 'About',
        icon: IconInfoSquareRounded,
        element: <About />,
    }
]
