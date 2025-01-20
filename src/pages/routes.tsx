import Home from './Home'
import Setup from './Setup'
import NothingFound from './NothingFound'
import {
    IconHome2,
    IconSettings,
} from '@tabler/icons-react'

export const routes = [
    { path: '/', element: <Home />, label: 'Home', icon: IconHome2 },
    { path: '/settings', element: <Setup />, label: 'Setup', icon: IconSettings },
    { path: '/debugging', element: <Home />, label: 'Debugging', icon: IconHome2 },
    { path: '*', element: <NothingFound />, label: 'NotFound', icon: IconHome2 },
]