import { IconHome2 } from '@tabler/icons-react'
import Home from './_index'
import NothingFound from './$anything'

export const routes = [
    { path: '/', element: <Home />, label: 'Home', icon: IconHome2 },
    { path: '*', element: <NothingFound />, label: 'NotFound', icon: IconHome2 },
]
