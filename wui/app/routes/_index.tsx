import { Container, Flex, Title, Text, Button } from '@mantine/core'
import { IconArrowRight, IconBrandTelegram, IconBrandGithub } from '@tabler/icons-react'
import { useLang } from '../contexts'

export default function Home() {
  const { t } = useLang()

  return (
    <Container size="sm" p="md">
      <Title order={2}>{t('pages.Home.project')} «Kvas Pro»</Title>
      <Text mt="xs">{t('pages.Home.description')}</Text>
      <Text mt="lg">{t('pages.Home.links')}</Text>

      <Flex
        gap="md"
        justify="flex-start"
        align="center"
        direction="row"
        wrap="wrap"
        mt='xs'
      >
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
