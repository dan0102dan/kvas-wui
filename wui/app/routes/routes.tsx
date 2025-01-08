import { IconHome2, IconSettings } from '@tabler/icons-react'
import Home from './_index'
import Settings from './settings._index'
import NothingFound from './$anything'

export const routes = [
    { path: '/', element: <Home />, label: 'Home', icon: IconHome2 },
    { path: '/settings', element: <Settings />, label: 'Setup', icon: IconSettings },
    { path: '/debugging', element: <Home />, label: 'Debugging', icon: IconHome2 },
    { path: '*', element: <NothingFound />, label: 'NotFound', icon: IconHome2 },
]
