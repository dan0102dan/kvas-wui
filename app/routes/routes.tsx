import { IconHome2, IconAddressBook } from '@tabler/icons-react'
import Home from './_index'
import Contacts from './contacts'

export const routes = [
    { path: '/', element: <Home />, label: 'Home', icon: IconHome2 },
    { path: '/contacts', element: <Contacts />, label: 'Contacts', icon: IconAddressBook },
]
