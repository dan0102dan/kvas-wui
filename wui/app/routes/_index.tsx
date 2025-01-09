// app/routes/_index.tsx
import React, { useEffect } from 'react'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Container, Flex, Title, Text, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowRight, IconBrandTelegram, IconBrandGithub } from '@tabler/icons-react'

import { getSession, commitSession } from '../utils/session.server'
import type { UserResponse } from '../api/licenseApi'
import { getDaysLeft } from '../utils/date'
import { useLang } from '../contexts'

interface LoaderData {
  user: UserResponse | null
  showSubscriptionModal?: boolean
  subscriptionMessage?: string
  visits?: number
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'))
  let sessionUser = session.get('user') as UserResponse | undefined

  if (!sessionUser) {
    return json<LoaderData>({ user: null })
  }

  let showSubscriptionModal = false
  let subscriptionMessage = ''

  const daysLeft = getDaysLeft(sessionUser.expirationDate)

  if (sessionUser.userType === 'paid') {
    if (daysLeft === 0) {
      showSubscriptionModal = true
      subscriptionMessage = 'Ваша платная подписка закончилась. Продлить?'
    } else if (daysLeft > 0 && daysLeft < 5) {
      showSubscriptionModal = true
      subscriptionMessage = `Осталось дней: ${daysLeft}. Рекомендуем продлить подписку.`
    }
  } else if (sessionUser.userType === 'free') {
    // Логика «каждый 9-й визит»
    const visits = parseInt(session.get('visits') || '0', 10) + 1

    if (visits % 9 === 0) {
      showSubscriptionModal = true
      subscriptionMessage = `Это ${visits}-ое посещение. Может, хотите приобрести подписку?`
    }

    session.set('visits', visits.toString())

    // Возвращаемся с Set-Cookie
    const headers = new Headers()
    headers.append('Set-Cookie', await commitSession(session))

    return json<LoaderData>(
      { user: sessionUser, showSubscriptionModal, subscriptionMessage, visits },
      { headers }
    )
  }

  // Если paid и дни > 0, или lifetime, или что-то ещё —
  // мы просто вернём JSON, но НЕ забываем финально установить cookie
  const headers = new Headers()
  headers.append('Set-Cookie', await commitSession(session))

  return json<LoaderData>(
    { user: sessionUser, showSubscriptionModal, subscriptionMessage },
    { headers }
  )
}

export default function Home() {
  const { t } = useLang()
  const { showSubscriptionModal, subscriptionMessage } = useLoaderData<LoaderData>()

  useEffect(() => {
    if (showSubscriptionModal && subscriptionMessage) {
      notifications.show({
        title: 'Предупреждение о подписке',
        message: subscriptionMessage,
        color: 'orange',
        autoClose: 5000,
      })
    }
  }, [showSubscriptionModal, subscriptionMessage])

  return (
    <Container size="sm" p="md">
      <Title order={2}>{t('pages.Home.project')} «Kvas Pro»</Title>
      <Text mt="xs">{t('pages.Home.description')}</Text>
      <Text mt="lg">{t('pages.Home.links')}</Text>

      <Flex mih={50} gap="md" justify="flex-start" align="center" direction="row" wrap="wrap" mt="xl">
        <Button
          variant="gradient"
          gradient={{ from: 'indigo', to: 'blue', deg: 247 }}
          leftSection={<IconBrandTelegram size={20} />}
          rightSection={<IconArrowRight size={14} />}
          component="a"
          href="https://t.me/kvas_pro"
          target="_blank"
        >
          {t('pages.Home.tgChat')}
        </Button>

        <Button
          variant="gradient"
          gradient={{ from: 'violet', to: 'grape', deg: 247 }}
          leftSection={<IconBrandGithub size={20} />}
          rightSection={<IconArrowRight size={14} />}
          component="a"
          href="https://github.com/qzeleza/kvas"
          target="_blank"
        >
          {t('pages.Home.githubRepo')}
        </Button>
      </Flex>
    </Container>
  )
}
