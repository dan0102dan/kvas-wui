import React, { useEffect, useState } from 'react'
import {
    Container,
    Title,
    Text,
    Card,
    Stack,
    Divider,
    Skeleton,
    Grid,
    Group,
    Badge,
    Avatar,
    ThemeIcon,
    SimpleGrid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
    IconPlugConnected,
    IconPlugX,
    IconNetwork,
    IconWorld
} from '@tabler/icons-react'
import { getConnections, type TunnelResponse } from '../api/routerApi'

const TunnelPage: React.FC = () => {
    const [tunnelData, setTunnelData] = useState<TunnelResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        getConnections()
            .then((res) => {
                setTunnelData(res)
            })
            .catch((error) => {
                console.error('Ошибка при получении данных: ', error)
                notifications.show({
                    title: 'Ошибка',
                    message: 'Не удалось загрузить данные о туннеле.',
                    color: 'red'
                })
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    // Компонент для отображения статуса подключения
    const ConnectionStatus = ({ connected }: { connected: boolean | undefined }) => (
        <Badge
            leftSection={
                <ThemeIcon
                    color={connected ? 'green' : 'red'}
                    variant="light"
                    size="span"
                    radius="xl"
                    mr={4}
                >
                    {connected ? <IconPlugConnected size={12} /> : <IconPlugX size={12} />}
                </ThemeIcon>
            }
            variant="outline"
            color={connected ? 'green' : 'red'}
        >
            {connected ? 'Подключено' : 'Не подключено'}
        </Badge>
    )

    // Карточка для интернет-шлюза
    const renderGatewayCard = () => (
        <Card withBorder radius="md" p="lg">
            <Group p="apart">
                <Title order={4}>Интернет шлюз</Title>
                <Avatar color="blue" radius="xl">
                    <IconWorld size={20} />
                </Avatar>
            </Group>

            <Divider my="sm" />

            <SimpleGrid cols={2} mt="md">
                <div>
                    <Text size="sm" color="dimmed">
                        Провайдер
                    </Text>
                    <Text>{tunnelData?.internet_gateway.provider}</Text>
                </div>

                <div>
                    <Text size="sm" color="dimmed">
                        Интерфейс
                    </Text>
                    <Text>{tunnelData?.internet_gateway.interface}</Text>
                </div>

                <div>
                    <Text size="sm" color="dimmed">
                        IP адрес
                    </Text>
                    <Text>{tunnelData?.internet_gateway.ip}</Text>
                </div>

                <div>
                    <Text size="sm" color="dimmed">
                        Статус
                    </Text>
                    <ConnectionStatus connected={tunnelData?.internet_gateway.connection} />
                </div>
            </SimpleGrid>
        </Card>
    )

    // Карточка для туннеля с дополнительной информацией о конфигурации
    const renderTunnelCard = () => (
        <Card withBorder radius="md" p="lg">
            <Group p="apart">
                <Title order={4}>Тоннель</Title>
                <Avatar color="teal" radius="xl">
                    <IconNetwork size={20} />
                </Avatar>
            </Group>

            <Divider my="sm" />

            <SimpleGrid cols={2} mt="md">
                <div>
                    <Text size="sm" color="dimmed">
                        Имя
                    </Text>
                    <Text>{tunnelData?.tunnel.name}</Text>
                </div>

                <div>
                    <Text size="sm" color="dimmed">
                        Статус
                    </Text>
                    <ConnectionStatus connected={tunnelData?.tunnel.connection} />
                </div>

                <div>
                    <Text size="sm" color="dimmed">
                        Внешний IP
                    </Text>
                    <Text>{tunnelData?.tunnel.ip}</Text>
                </div>

                <div>
                    <Text size="sm" color="dimmed">
                        Порт
                    </Text>
                    <Text>{tunnelData?.tunnel.config.server_port}</Text>
                </div>
            </SimpleGrid>

            <Divider my="sm" />

            <SimpleGrid cols={2} mt="md">
                <div>
                    <Text size="sm" color="dimmed">
                        Метод
                    </Text>
                    <Text>{tunnelData?.tunnel.config.method}</Text>
                </div>
                <div>
                    <Text size="sm" color="dimmed">
                        Локальный порт
                    </Text>
                    <Text>{tunnelData?.tunnel.config.local_port}</Text>
                </div>
            </SimpleGrid>
        </Card>
    )

    // Карточка для сети (используется как для доступных, так и для обнаруженных сетей)
    const renderNetworkCard = (network: {
        name: string
        ip?: string
        interface: string
        description?: string
        type?: string
    }) => (
        <Card withBorder radius="md" p="lg" key={network.name}>
            <Group p="apart">
                <div>
                    <Text w={500}>{network.name}</Text>
                    {network.description && (
                        <Text size="sm" color="dimmed">
                            {network.description}
                        </Text>
                    )}
                </div>
                {network.type && (
                    <Badge variant="outline" color="gray">
                        {network.type}
                    </Badge>
                )}
            </Group>

            <Divider my="sm" />

            <Stack gap={4} mt="md">
                {network.ip && (
                    <Text size="sm">
                        <Text component="span" color="dimmed">
                            IP:
                        </Text>{' '}
                        {network.ip}
                    </Text>
                )}
                <Text size="sm">
                    <Text component="span" color="dimmed">
                        Интерфейс:
                    </Text>{' '}
                    {network.interface}
                </Text>
            </Stack>
        </Card>
    )

    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="xl">
                Информация о подключениях
            </Title>

            {loading ? (
                <Skeleton height={200} radius="md" />
            ) : (
                <Grid gutter="xl">
                    <Grid.Col span={12}>
                        {renderGatewayCard()}
                    </Grid.Col>
                    <Grid.Col span={12}>
                        {renderTunnelCard()}
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <Title order={4} mt="xl" mb="md">
                            Доступные сети
                        </Title>
                        <SimpleGrid cols={3} spacing="lg">
                            {tunnelData?.available_networks.map(renderNetworkCard)}
                        </SimpleGrid>
                    </Grid.Col>

                    {tunnelData?.scanned_networks && tunnelData.scanned_networks.length > 0 && (
                        <Grid.Col span={12}>
                            <Title order={4} mt="xl" mb="md">
                                Обнаруженные сети
                            </Title>
                            <SimpleGrid cols={3} spacing="lg">
                                {tunnelData.scanned_networks.map(renderNetworkCard)}
                            </SimpleGrid>
                        </Grid.Col>
                    )}
                </Grid>
            )}
        </Container>
    )
}

export default TunnelPage
