import { createCookieSessionStorage } from '@remix-run/node'

const SESSION_SECRET = '2fa68c4bd16841bf3ad26d960e53626f99e07569e674b8174f3dbb29a5a99074'

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
