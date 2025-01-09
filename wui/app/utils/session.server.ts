import { createCookieSessionStorage } from '@remix-run/node'

// При сборке нужно заменить из process.env.SESSION_SECRET !!!
const SESSION_SECRET = process.env.SESSION_SECRET || 'SUPER_SECRET_KEY_ABC'

export const { getSession, commitSession, destroySession } = createCookieSessionStorage({
    cookie: {
        name: '__session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets: [SESSION_SECRET],
        secure: process.env.NODE_ENV === 'production',
    },
})
