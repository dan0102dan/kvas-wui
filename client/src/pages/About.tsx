import {
    Container,
    Title,
    Text,
    Flex,
    Button,
    Center,
    SimpleGrid,
    Badge,
    Group,
    Card,
} from '@mantine/core'
import {
    IconArrowRight,
    IconBrandTelegram,
    IconBrandGithub,
    IconCookie,
    IconGauge,
    IconUser
} from '@tabler/icons-react'
import { NetworkBackground } from '../components'
import { useLang } from '../contexts'

const About: React.FC = () => {
    const { t } = useLang()

    return (
        <>
            <Flex
                direction="column"
                // вычитаем размер Header'а
                style={{ minHeight: 'calc(100vh - 60px)' }}
            >
                <Container py="xl" flex={1}>
                    <Center mb="md">
                        <Title ta='center'>
                            {t('pages.About.project') + ' '}
                            <Text component="span" c="blue" inherit>
                                «Квас WUI»
                            </Text>
                        </Title>
                    </Center>

                    <Center mb="xl">
                        <Container size={600} p={0}>
                            <Text size="lg" c="dimmed">
                                {t('pages.About.description')}
                            </Text>
                        </Container>
                    </Center>

                    <Flex justify="center" align="center" wrap="wrap" gap="md">
                        <Button
                            variant="gradient"
                            gradient={{ from: 'indigo', to: 'blue', deg: 247 }}
                            leftSection={<IconBrandTelegram size={20} />}
                            rightSection={<IconArrowRight size={14} />}
                            component="a"
                            href="https://t.me/+q_2_dYFnm3cyNjUy"
                            target="_blank"
                            size='md'
                        >
                            {t('pages.About.tgChannel')}
                        </Button>

                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape', deg: 247 }}
                            leftSection={<IconBrandGithub size={20} />}
                            rightSection={<IconArrowRight size={14} />}
                            component="a"
                            href="https://github.com/dan0102dan/kvas-wui"
                            target="_blank"
                            size='md'
                        >
                            {t('pages.About.githubRepo')}
                        </Button>
                    </Flex>
                </Container>

                <Group justify="center" py="md">
                    <Badge variant="filled" size="lg">
                        {t('pages.About.slogan')}
                    </Badge>
                </Group>
            </Flex>

            <Container size="lg" pb="xl">
                <Title order={2} ta="center" mt="sm">
                    {t('pages.About.whyUs')}
                </Title>

                <Text c="dimmed" ta="center" mt="md">
                    {t('pages.About.whyUsDescription')}
                </Text>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt={50}>
                    {[
                        {
                            title: 'Экстремальная производительность',
                            description:
                                'Наш продукт обеспечивает невероятную скорость работы, позволяя обрабатывать большие нагрузки без потерь в качестве. Благодаря оптимизированному коду и современным технологиям, ваша сеть всегда на высоте.',
                            icon: IconGauge,
                        },
                        {
                            title: 'Защита и приватность',
                            description:
                                'Уделяем максимальное внимание безопасности данных. Наша система использует последние шифровальные алгоритмы, что гарантирует защиту от посторонних вмешательств и утечек информации.',
                            icon: IconUser,
                        },
                        {
                            title: 'Без сторонних сервисов',
                            description:
                                'Все вычисления и процессы выполняются локально, без привлечения сторонних сервисов. Это позволяет избежать дополнительных рисков и обеспечить полное соответствие требованиям конфиденциальности.',
                            icon: IconCookie,
                        },
                    ].map((feature) => (
                        <Card key={feature.title} shadow="md" radius="md" padding="xl">
                            <feature.icon color="var(--mantine-color-blue-filled)" size={50} stroke={2} />
                            <Text fz="lg" fw={500} mt="md">
                                {feature.title}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {feature.description}
                            </Text>
                        </Card>
                    ))}
                </SimpleGrid>
            </Container>
            {/* Фоновый компонент */}
            <NetworkBackground
                numberOfNodes={30}
                lineDistance={140}
                baseDotSize={3}
                sizeGrowthFactor={0.25}
                animationSpeed={0.8}
                fpsLimit={60}
                enableClickToAdd
                maxParticles={60}
            />
        </>
    )
}

export default About