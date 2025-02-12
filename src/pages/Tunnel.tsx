import React, { useEffect, useState } from 'react'
import {
    Container,
    Paper,
    Title,
    Text,
    Card,
    Stack,
    Divider,
    Skeleton,
    Grid,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
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
                    color: 'red',
                })
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    return (
        <Container size="md" py="xl">
            {loading ? (
                <Skeleton height={200} radius="md" mb="xl" />
            ) : (
                <Paper withBorder radius="md" p="md" mb="xl">
                    <Title order={2}>Информация о туннеле</Title>
                </Paper>
            )}

            {/* Интернет шлюз */}
            {loading ? (
                <Skeleton height={150} radius="md" mb="xl" />
            ) : (
                <Paper withBorder radius="md" p="md" mb="xl">
                    <Title order={4}>Интернет шлюз</Title>
                    <Text>Провайдер: {tunnelData?.['internet-gateway'].provider}</Text>
                    <Text>Сетевой интерфейс: {tunnelData?.['internet-gateway'].interface}</Text>
                    <Text>IP адрес: {tunnelData?.['internet-gateway'].ip}</Text>
                    <Text>Keenetic-имя: {tunnelData?.['internet-gateway'].keenetic}</Text>
                    <Text>
                        Подключение:{' '}
                        {tunnelData?.['internet-gateway'].connection ? 'есть' : 'нет'}
                    </Text>
                </Paper>
            )}

            {/* Тоннель */}
            {loading ? (
                <Skeleton height={150} radius="md" mb="xl" />
            ) : (
                <Paper withBorder radius="md" p="md" mb="xl">
                    <Title order={4}>Тоннель</Title>
                    <Text>Название: {tunnelData?.tunnel.name}</Text>
                    <Text>Подключение: {tunnelData?.tunnel.connection ? 'есть' : 'нет'}</Text>
                    <Text>IP адрес: {tunnelData?.tunnel.ip}</Text>
                    <Text>Домен: {tunnelData?.tunnel.domain}</Text>
                </Paper>
            )}

            <Divider my="xl" />

            {/* Доступные сети */}
            {loading ? (
                <Skeleton height={200} radius="md" mb="xl" />
            ) : (
                <Paper withBorder radius="md" p="md" mb="xl">
                    <Title order={4}>Доступные для тоннеля сети</Title>
                    <Grid>
                        {tunnelData?.aviable_networks.map((network, index) => (
                            <Grid.Col span={12} key={index}>
                                <Card shadow="sm" radius="md" withBorder p="md" mb="md">
                                    <Stack>
                                        <Text w={500}>{network.name}</Text>
                                        <Text size="sm">IP: {network.ip}</Text>
                                        <Text size="sm">Интерфейс: {network.interface}</Text>
                                        <Text size="sm">Описание: {network.description}</Text>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Paper>
            )}
        </Container>
    )
}

export default TunnelPage
