import {
  Container,
  Title,
  Text,
  Flex,
  Button,
  Center,
  Box,
} from '@mantine/core'
import { IconArrowRight, IconBrandTelegram, IconBrandGithub } from '@tabler/icons-react'
import { NetworkBackground } from '../components'
import { useLang } from '../contexts'

export default function Home() {
  const { t } = useLang()

  return (
    <Container size="sm" py="xl" px="md">
      <Center mb="md">
        <Title
          ta='center'
          w={800}
        >
          {t('pages.Home.project') + ' '}
          <Text component="span" color="blue" inherit>
            «Квас Pro»
          </Text>
        </Title>
      </Center>

      <Center mb="xl">
        <Container size={600} p={0}>
          <Text size="lg" color="dimmed">
            {t('pages.Home.description')}
          </Text>
        </Container>
      </Center >

      <Flex justify="center" align="center" wrap="wrap" gap="md">
        <Button
          variant="gradient"
          gradient={{ from: 'indigo', to: 'blue', deg: 247 }}
          leftSection={<IconBrandTelegram size={20} />}
          rightSection={<IconArrowRight size={14} />}
          component="a"
          href="https://t.me/kvas_pro"
          target="_blank"
          size='md'
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
          size='md'
        >
          {t('pages.Home.githubRepo')}
        </Button>
      </Flex>

      <NetworkBackground
        numberOfNodes={30}
        lineDistance={140}
        baseDotSize={3}
        sizeGrowthFactor={0.25}
        animationSpeed={0.8}
        fpsLimit={30}
        enableClickToAdd
      />
    </Container>
  )
}
