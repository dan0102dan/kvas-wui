import { IconHome2, IconSettings, IconPhone, IconUser } from '@tabler/icons-react'
import Home from './pages/Home'
import Contacts from './pages/Contacts'
import Profile from './pages/Profile'
import Setup from './pages/Setup'
import NotFound from './pages/NotFound'

/**
 * Тип, описывающий один роут в приложении.
 * "index" означает, что это будет корневой ("/"), 
 * а path === "*" означает роут для 404.
 */
export interface Route {
    path: string
    index?: boolean
    label: string
    icon: React.ElementType
    element: React.ReactNode
    hidden?: boolean
}

/**
 * Основной массив всех роутов.
 * Каждый объект описывает одну страницу: её путь, компонент, иконку, название.
 *
 * Для случая index-роута (напр. главная страница "/"), в React Router 6+
 * можно использовать { index: true } вместо path.
 * Для 404 указываем { path: "*", ... }.
 *
 * Параметр hidden?: boolean — если хотим исключить роут из меню.
 */
export const routes: Route[] = [
    {
        index: true,
        path: '/',
        label: 'Home',
        icon: IconHome2,
        element: <Home />,
    },
    {
        path: 'contacts',
        label: 'Contacts',
        icon: IconPhone,
        element: <Contacts />,
    },
    {
        path: 'profile',
        label: 'Profile',
        icon: IconUser,
        element: <Profile />,
    },
    {
        path: 'setup',
        label: 'Setup',
        icon: IconSettings,
        element: <Setup />,
    },
    {
        path: '*',
        label: 'NotFound',
        icon: IconHome2,
        element: <NotFound />,
        hidden: true,
    },
]
