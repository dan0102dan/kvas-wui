import React, { useEffect, useState } from 'react'
import {
    Container,
    SimpleGrid,
    Group,
    Card,
    Text,
    Title,
    Divider,
    Progress,
    Skeleton,
} from '@mantine/core'
import {
    IconCpu,
    IconServer,
    IconDeviceDesktopAnalytics,
    IconDatabase,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DonutChart, LineChart, CompositeChart } from '@mantine/charts'
import { subscribeToSystemStats } from '../api/routerApi'
import { useLang } from '../contexts'

const MAX_POINTS = 30

function pushPoint<T>(prev: T[], point: T): T[] {
    const updated = [...prev, point]
    if (updated.length > MAX_POINTS) {
        updated.shift()
    }
    return updated
}

function formatTimeTick(t: number): string {
    const d = new Date(t)
    return d.toLocaleTimeString('ru-RU', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

function formatSpeed(speedBps: number): string {
    if (speedBps >= 1024 * 1024)
        return (speedBps / (1024 * 1024)).toFixed(1) + ' MB/s'
    if (speedBps >= 1024)
        return (speedBps / 1024).toFixed(1) + ' KB/s'
    return speedBps.toFixed(0) + ' B/s'
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024)
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    if (bytes >= 1024)
        return (bytes / 1024).toFixed(1) + ' KB'
    return bytes.toFixed(0) + ' B'
}

function formatUptime(uptimeSec: number): string {
    const days = Math.floor(uptimeSec / 86400)
    const hours = Math.floor((uptimeSec % 86400) / 3600)
    const minutes = Math.floor((uptimeSec % 3600) / 60)
    let parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (parts.length === 0) parts.push('0m')
    return parts.join(' ')
}

interface CPUHistoryPoint {
    time: number
    user: number
    sys: number
    iowait: number
    steal: number
    idle: number
}

interface NetHistoryPoint {
    time: number
    rx: number
    tx: number
}

const SystemDashboard: React.FC = () => {
    const { t } = useLang()
    const [stats, setStats] = useState<Parameters<Parameters<typeof subscribeToSystemStats>[0]>[0] | null>(null)
    const [cpuHistory, setCpuHistory] = useState<CPUHistoryPoint[]>([])
    const [netHistory, setNetHistory] = useState<NetHistoryPoint[]>([])

    useEffect(() => {
        const unsubscribe = subscribeToSystemStats(
            (data) => {
                const now = Date.now()
                setStats(data)
                setCpuHistory((prev) =>
                    pushPoint(prev, {
                        time: now,
                        user: data.cpu.user,
                        sys: data.cpu.sys,
                        iowait: data.cpu.iowait,
                        steal: data.cpu.steal,
                        idle: data.cpu.idle,
                    })
                )
                setNetHistory((prev) =>
                    pushPoint(prev, {
                        time: now,
                        rx: data.network.rxSpeedBps,
                        tx: data.network.txSpeedBps,
                    })
                )
            },
            () => {
                notifications.show({
                    title: t('pages.SystemStatus.error'),
                    message: t('pages.SystemStatus.errorMessage'),
                    color: 'red',
                })
            }
        )
        return () => {
            unsubscribe()
        }
    }, [t])

    const cpuChartData = cpuHistory.map((p) => ({
        time: p.time,
        user: p.user,
        sys: p.sys,
        iowait: p.iowait,
        steal: p.steal,
        idle: p.idle,
    }))

    const netChartData = netHistory.map((p) => ({
        time: p.time,
        rx: p.rx,
        tx: p.tx,
    }))

    // Определяем единицу для отображения скорости сети
    const maxSpeed = netChartData.reduce((max, item) => Math.max(max, item.rx, item.tx), 0)
    let speedFactor = 1
    let speedUnit = 'B/s'
    if (maxSpeed >= 1024 * 1024) {
        speedFactor = 1024 * 1024
        speedUnit = 'MB/s'
    } else if (maxSpeed >= 1024) {
        speedFactor = 1024
        speedUnit = 'KB/s'
    }

    // Donut chart для памяти с переводом меток
    const memoryDonutData = [
        { name: t('pages.SystemStatus.memoryFree'), value: stats?.memory.free || 0, color: 'teal' },
        { name: t('pages.SystemStatus.memoryUsed'), value: stats?.memory.used || 0, color: 'red' },
        { name: t('pages.SystemStatus.memoryCache'), value: stats?.memory.pageCache || 0, color: 'blue' },
    ]

    const totalMemory = stats ? stats.memory.free + stats.memory.used + stats.memory.pageCache : 0
    const memoryUsagePercent = totalMemory > 0 ? Math.round((stats!.memory.used / totalMemory) * 100) : 0

    const fsUsedPercent = stats && stats.filesystem.total > 0
        ? (stats.filesystem.used / stats.filesystem.total) * 100
        : 0

    return (
        <Container py="xl">
            <Title mb="lg">{t('pages.SystemStatus.title')}</Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {/* CPU Card */}
                <Card withBorder pt="xs">
                    <Skeleton visible={!stats}>
                        <Group justify="space-between" wrap="nowrap">
                            <div>
                                <Text size="xl">
                                    {stats ? Math.round(stats.cpu.usage) : ''}
                                </Text>
                                <Text size="sm" color="dimmed">
                                    {t('pages.SystemStatus.cpuUsage')}
                                </Text>
                            </div>
                            <IconCpu size={32} />
                        </Group>

                        <Divider my="xs" />

                        <Group justify="space-between" mb="xs">
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuSys')}: {stats ? stats.cpu.sys.toFixed(1) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuUser')}: {stats ? stats.cpu.user.toFixed(1) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuIowait')}: {stats ? stats.cpu.iowait.toFixed(1) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuSteal')}: {stats ? stats.cpu.steal.toFixed(1) : ''}
                            </Text>
                        </Group>

                        <Divider my="xs" />

                        <Group justify="space-between" mb="xs">
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuCores')}: {stats ? stats.cpu.cores : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuIdle')}: {stats ? stats.cpu.idle.toFixed(1) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuUptime')}: {stats ? formatUptime(stats.cpu.uptimeSec) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.cpuLoad')}: {stats ? stats.cpu.load.join(', ') : ''}
                            </Text>
                        </Group>

                        <Divider my="xs" />

                        <Text size="sm" color="dimmed" mb="xs">
                            {t('pages.SystemStatus.cpuHistory')}
                        </Text>
                        <CompositeChart
                            h={200}
                            data={cpuChartData}
                            dataKey="time"
                            yAxisProps={{ domain: [0, 100] }}
                            series={[
                                { name: 'user', color: 'blue', type: 'line' },
                                { name: 'sys', color: 'red', type: 'line' },
                                { name: 'iowait', color: 'yellow', type: 'line' },
                                { name: 'steal', color: 'pink', type: 'line' },
                                { name: 'idle', color: 'purple', type: 'line' },
                            ]}
                            xAxisProps={{
                                tickFormatter: formatTimeTick,
                            }}
                        />
                    </Skeleton>
                </Card>

                {/* Network Card */}
                <Card withBorder pt="xs">
                    <Skeleton visible={!stats}>
                        <Group justify="space-between" wrap="nowrap">
                            <div>
                                <Text size="xl">
                                    {t('pages.SystemStatus.networkRx')}: {stats ? formatSpeed(stats.network.rxSpeedBps) : ''}
                                </Text>
                                <Text size="sm" color="dimmed" mb="xs">
                                    {t('pages.SystemStatus.network')}
                                </Text>
                            </div>
                            <IconServer size={32} />
                        </Group>

                        <Divider my="xs" />

                        <Group justify="space-between" mb="xs">
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkTx')}: {stats ? formatSpeed(stats.network.txSpeedBps) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkIn')}: {stats ? formatBytes(stats.network.rxTotal) : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkOut')}: {stats ? formatBytes(stats.network.txTotal) : ''}
                            </Text>
                        </Group>

                        <Divider my="xs" />

                        <Group justify="space-between" mb="xs">
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkRetrans')}: {stats ? stats.network.retrans : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkActive')}: {stats ? stats.network.active : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkPassive')}: {stats ? stats.network.passive : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkFails')}: {stats ? stats.network.fails : ''}
                            </Text>
                            <Text size="sm" color="dimmed">
                                {t('pages.SystemStatus.networkIfaces')}: {stats ? stats.network.interfaces : ''}
                            </Text>
                        </Group>

                        <Divider my="xs" />

                        <Text size="sm" color="dimmed" mb="xs">
                            {t('pages.SystemStatus.networkHistory')}
                        </Text>
                        <LineChart
                            h={200}
                            data={netChartData}
                            dataKey="time"
                            unit={speedUnit}
                            valueFormatter={(value: number) =>
                                new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value / speedFactor)
                            }
                            series={[
                                { name: 'rx', label: t('pages.SystemStatus.networkRx'), color: 'green' },
                                { name: 'tx', label: t('pages.SystemStatus.networkTx'), color: 'orange' },
                            ]}
                            xAxisProps={{ tickFormatter: formatTimeTick }}
                            yAxisProps={{ domain: ['auto', 'auto'] }}
                        />
                    </Skeleton>
                </Card>

                {/* Memory Card */}
                <Card withBorder pt="xs">
                    <Skeleton visible={!stats}>
                        <Group justify="space-between" wrap="nowrap">
                            <div>
                                <Text size="xl">
                                    {stats ? memoryUsagePercent : ''}%
                                </Text>
                                <Text size="sm" color="dimmed">
                                    {t('pages.SystemStatus.memoryUsage')}
                                </Text>
                            </div>
                            <IconDeviceDesktopAnalytics size={32} />
                        </Group>
                        <Divider my="xs" />

                        <Group justify="center" mt="md" gap="xl">
                            <DonutChart size={140} thickness={20} data={memoryDonutData} />
                            <Group gap={4}>
                                <Text size="sm" color="dimmed">
                                    {t('pages.SystemStatus.memoryFree')}: {stats ? stats.memory.free : ''}M
                                </Text>
                                <Text size="sm" color="dimmed">
                                    {t('pages.SystemStatus.memoryUsed')}: {stats ? stats.memory.used : ''}M
                                </Text>
                                <Text size="sm" color="dimmed">
                                    {t('pages.SystemStatus.memoryCache')}: {stats ? stats.memory.pageCache : ''}M
                                </Text>
                            </Group>
                        </Group>
                    </Skeleton>
                </Card>

                {/* Filesystem Card */}
                <Card withBorder pt="xs">
                    <Skeleton visible={!stats}>
                        <Group justify="space-between" wrap="nowrap">
                            <div>
                                <Text size="xl">
                                    {stats ? `${stats.filesystem.used}M / ${stats.filesystem.total}M` : ''}
                                </Text>
                                <Text size="sm" color="dimmed">
                                    {t('pages.SystemStatus.filesystem')}
                                </Text>
                            </div>
                            <IconDatabase size={32} />
                        </Group>
                        <Divider my="xs" />

                        <Progress value={fsUsedPercent} color="red" size="lg" radius="lg" />
                        <Text mt="sm" color="dimmed" size="sm">
                            {stats ? Math.round(fsUsedPercent) + '%' : ''}
                        </Text>
                    </Skeleton>
                </Card>
            </SimpleGrid>
        </Container>
    )
}

export default SystemDashboard
