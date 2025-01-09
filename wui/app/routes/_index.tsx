import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useEffect } from 'react'
import { useLoaderData } from '@remix-run/react'
import { Container, Flex, Title, Text, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowRight, IconBrandTelegram, IconBrandGithub } from '@tabler/icons-react'
import { getUserByKey, createUser } from '../utils/licenseApi.server'
import type { IUserResponse } from '../utils/types'
import { useLang } from '../contexts'

function getDaysLeft(expiration_date: string): number {
  const now = new Date().getTime()
  const exp = new Date(expiration_date).getTime()
  if (isNaN(exp)) return 0
  const diff = exp - now
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
}

interface LoaderData {
  user: IUserResponse
  showSubscriptionModal?: boolean
  subscriptionMessage?: string
}

export async function loader({ request }: LoaderFunctionArgs) {
  const uniqueKey = 'MY-UNIQUE-KEY-1234'

  let user = await getUserByKey(uniqueKey)
  if (!user) {
    user = await createUser({
      service_code: 'someService',
      email: 'some@email.com',
      unique_key: uniqueKey,
      architecture: 'x64',
      count_of_purchases: 0,
    })
  }

  let showSubscriptionModal = false
  let subscriptionMessage = ''
  const daysLeft = getDaysLeft(user.expiration_date)

  user.type = 'free'

  if (user.type === 'paid') {
    if (daysLeft === 0) {
      showSubscriptionModal = true
      subscriptionMessage = 'Ваша платная подписка закончилась. Продлить?'
    } else if (daysLeft > 0 && daysLeft < 5) {
      showSubscriptionModal = true
      subscriptionMessage = `Осталось дней: ${daysLeft}. Рекомендуем продлить подписку.`
    }
  } else if (user.type === 'lifetime') {
    // Lifetime => ничего не показываем
  } else if (user.type === 'free') {
    const cookieHeader = request.headers.get('Cookie') || ''
    let visits = 1
    if (cookieHeader.includes('visits=')) {
      const match = cookieHeader.match(/visits=(\d+)/)
      if (match) {
        visits = parseInt(match[1], 10) + 1
      }
    }

    if (visits % 9 === 0) {
      showSubscriptionModal = true
      subscriptionMessage = `Это ${visits} % 9 === 0 загрузка. Может, хотите приобрести подписку?`
    }
    console.log(visits)

    const headers = new Headers()
    headers.append('Set-Cookie', `visits=${visits}; Path=/; HttpOnly;`)

    return json<LoaderData>(
      { user, showSubscriptionModal, subscriptionMessage },
      { headers }
    )
  }

  return json<LoaderData>({ user, showSubscriptionModal, subscriptionMessage })
}

export default function Home() {
  const { t } = useLang()
  const { user, showSubscriptionModal, subscriptionMessage } = useLoaderData<LoaderData>()

  useEffect(() => {
    console.log('showSubscriptionModal', showSubscriptionModal, subscriptionMessage)
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
