import React, { useEffect, useState, useRef } from 'react'
import {
    Container,
    SimpleGrid,
    Group,
    Card,
    Text,
    Title,
    Divider,
    Progress,
    useMantineTheme,
} from '@mantine/core'
import {
    IconCpu,
    IconServer,
    IconDeviceDesktopAnalytics,
    IconDatabase,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DonutChart, LineChart, CompositeChart } from '@mantine/charts'
import { getSystemStats } from '../api/routerApi'


function smooth(prevVal: number, newVal: number, alpha = ALPHA): number {
    return alpha * newVal + (1 - alpha) * prevVal
}

function pushPoint<T>(prev: T[], point: T): T[] {
    const updated = [...prev, point]
    if (updated.length > MAX_POINTS) {
        updated.shift()
    }
    return updated
}

function parseSpeedToBps(speedStr: string): number {
    const lower = speedStr.toLowerCase().replace(/\s/g, '')
    const match = lower.match(/^([\d.]+)([bkmg])?\/s$/)
    if (!match) return 0
    const val = parseFloat(match[1] ?? '0')
    const unit = match[2] ?? 'b'
    switch (unit) {
        case 'k':
            return val * 1024
        case 'm':
            return val * 1024 * 1024
        case 'g':
            return val * 1024 * 1024 * 1024
        default:
            return val
    }
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


const MAX_POINTS = 30
const FETCH_INTERVAL = 1000
const ALPHA = 0.3

interface SystemStats {
    cpu: {
        usage: number
        sys: number
        user: number
        iowait: number
        steal: number
        cores: number
        idle: number
        uptime: string
        load: [number, number, number]
    }
    memory: {
        free: number
        used: number
        pageCache: number
        usage: number
    }
    network: {
        rxSpeed: string
        txSpeed: string
        rxTotal: string
        txTotal: string
        retrans: number
        active: number
        passive: number
        fails: number
        interfaces: number
    }
    filesystem: {
        name: string
        used: number
        total: number
    }
}

interface CPUHistoryPoint {
    time: number
    user: number
    sys: number
    iowait: number
    steal: number
    idle: number
}

interface MemHistoryPoint {
    time: number
    used: number
    free: number
    cache: number
}

interface NetHistoryPoint {
    time: number
    rx: number
    tx: number
}

const SystemDashboard: React.FC = () => {
    const theme = useMantineTheme()
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [loading, setLoading] = useState(true)

    const [cpuHistory, setCpuHistory] = useState<CPUHistoryPoint[]>([])
    const [memHistory, setMemHistory] = useState<MemHistoryPoint[]>([])
    const [netHistory, setNetHistory] = useState<NetHistoryPoint[]>([])

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const fetchStats = async () => {
        try {
            const data = await getSystemStats()
            setStats(data)
            setLoading(false)

            const now = Date.now()

            setCpuHistory((prev) => {
                const last = prev[prev.length - 1]
                const point: CPUHistoryPoint = {
                    time: now,
                    user: last ? smooth(last.user, data.cpu.user) : data.cpu.user,
                    sys: last ? smooth(last.sys, data.cpu.sys) : data.cpu.sys,
                    iowait: last ? smooth(last.iowait, data.cpu.iowait) : data.cpu.iowait,
                    steal: last ? smooth(last.steal, data.cpu.steal) : data.cpu.steal,
                    idle: last ? smooth(last.idle, data.cpu.idle) : data.cpu.idle,
                }
                return pushPoint(prev, point)
            })

            setMemHistory((prev) => {
                const last = prev[prev.length - 1]
                const point: MemHistoryPoint = {
                    time: now,
                    used: last ? smooth(last.used, data.memory.used) : data.memory.used,
                    free: last ? smooth(last.free, data.memory.free) : data.memory.free,
                    cache: last ? smooth(last.cache, data.memory.pageCache) : data.memory.pageCache,
                }
                return pushPoint(prev, point)
            })

            setNetHistory((prev) => {
                const last = prev[prev.length - 1]
                const rxNum = parseSpeedToBps(data.network.rxSpeed)
                const txNum = parseSpeedToBps(data.network.txSpeed)
                const point: NetHistoryPoint = {
                    time: now,
                    rx: last ? smooth(last.rx, rxNum) : rxNum,
                    tx: last ? smooth(last.tx, txNum) : txNum,
                }
                return pushPoint(prev, point)
            })
        } catch (err) {
            notifications.show({
                title: 'Ошибка',
                message: 'Не удалось загрузить данные о системе',
                color: 'red',
            })
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        intervalRef.current = setInterval(fetchStats, FETCH_INTERVAL)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    if (loading && !stats) {
        return (
            <Container size="lg" p="xl">
                <Title>Загрузка...</Title>
            </Container>
        )
    }
    if (!stats) {
        return (
            <Container size="lg" p="xl">
                <Title>Нет данных</Title>
            </Container>
        )
    }

    const cpuChartData = cpuHistory.map((p) => ({
        time: p.time,
        user: p.user,
        sys: p.sys,
        iowait: p.iowait,
        steal: p.steal,
        idle: p.idle,
    }))
    const memChartData = memHistory.map((p) => ({
        time: p.time,
        used: p.used,
        free: p.free,
        cache: p.cache,
    }))
    const netChartData = netHistory.map((p) => ({
        time: p.time,
        rx: p.rx,
        tx: p.tx,
    }))

    const memoryDonutData = [
        { name: 'Free', value: stats.memory.free, color: theme.colors.teal[6] },
        { name: 'Used', value: stats.memory.used, color: theme.colors.red[6] },
        { name: 'Cache', value: stats.memory.pageCache, color: theme.colors.blue[6] },
    ]

    const fsUsedPercent =
        stats.filesystem.total > 0
            ? (stats.filesystem.used / stats.filesystem.total) * 100
            : 0

    return (
        <Container size="lg" p="md">
            <Title order={2} mb="md">
                OpenWRT Router Dashboard
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Card radius="md" withBorder p="md">
                    <Group justify="space-between" align="center" mb="xs">
                        <Group align="center">
                            <IconCpu size={28} />
                            <Text size="xl" fw={700}>
                                {Math.round(stats.cpu.usage)}%
                            </Text>
                        </Group>
                        <Text size="sm" color="dimmed">
                            CPU Usage
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Group justify="space-between" align="center">
                        <Text size="sm" color="dimmed">
                            Sys: {stats.cpu.sys.toFixed(1)}%
                        </Text>
                        <Text size="sm" color="dimmed">
                            User: {stats.cpu.user.toFixed(1)}%
                        </Text>
                        <Text size="sm" color="dimmed">
                            iowait: {stats.cpu.iowait.toFixed(1)}%
                        </Text>
                        <Text size="sm" color="dimmed">
                            Steal: {stats.cpu.steal.toFixed(1)}%
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Group justify="space-between" align="center">
                        <Text size="sm" color="dimmed">
                            Cores: {stats.cpu.cores}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Idle: {stats.cpu.idle.toFixed(1)}%
                        </Text>
                        <Text size="sm" color="dimmed">
                            Uptime: {stats.cpu.uptime}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Load: {stats.cpu.load.join(', ')}
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Text size="sm" color="dimmed" mb={5}>
                        CPU usage (detailed) history
                    </Text>
                    <CompositeChart
                        h={200}
                        data={cpuChartData}
                        dataKey="time"
                        yAxisProps={{ domain: [0, 100] }}
                        series={[
                            { name: 'user', color: 'blue.5', type: 'line' },
                            { name: 'sys', color: 'red.5', type: 'line' },
                            { name: 'iowait', color: 'yellow.5', type: 'line' },
                            { name: 'steal', color: 'pink.5', type: 'line' },
                            { name: 'idle', color: 'gray.5', type: 'line' },
                        ]}
                        xAxisProps={{
                            tickFormatter: (v) => formatTimeTick(v),
                        }}
                    />
                </Card>

                <Card radius="md" withBorder p="md">
                    <Group justify="space-between" align="center" mb="xs">
                        <Group align="center">
                            <IconDeviceDesktopAnalytics size={28} />
                            <Text size="xl" fw={700}>
                                {stats.memory.usage}%
                            </Text>
                        </Group>
                        <Text size="sm" color="dimmed">
                            Memory Usage
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Group justify="center" mt="md">
                        <DonutChart size={140} thickness={20} data={memoryDonutData} />
                        <Group>
                            <Text size="sm" color="dimmed">
                                Free: {stats.memory.free}M
                            </Text>
                            <Text size="sm" color="dimmed">
                                Used: {stats.memory.used}M
                            </Text>
                            <Text size="sm" color="dimmed">
                                Cache: {stats.memory.pageCache}M
                            </Text>
                        </Group>
                    </Group>

                    <Divider my="xs" />

                    <Text size="sm" color="dimmed" mb={5}>
                        Memory usage history
                    </Text>
                    <CompositeChart
                        h={150}
                        data={memChartData}
                        dataKey="time"
                        series={[
                            { name: 'used', color: 'red.5', type: 'line' },
                            { name: 'free', color: 'teal.5', type: 'line' },
                            { name: 'cache', color: 'blue.5', type: 'line' },
                        ]}
                        xAxisProps={{ tickFormatter: formatTimeTick }}
                    />
                </Card>

                <Card radius="md" withBorder p="md">
                    <Group justify="space-between" align="center" mb="xs">
                        <Group align="center">
                            <IconServer size={28} />
                            <Text size="xl" fw={700}>
                                RX: {stats.network.rxSpeed}
                            </Text>
                        </Group>
                        <Text size="sm" color="dimmed">
                            Network
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Group justify="space-between" align="center">
                        <Text size="sm" color="dimmed">
                            TX: {stats.network.txSpeed}
                        </Text>
                        <Text size="sm" color="dimmed">
                            In: {stats.network.rxTotal}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Out: {stats.network.txTotal}
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Group justify="space-between" align="center">
                        <Text size="sm" color="dimmed">
                            Retrans: {stats.network.retrans}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Active: {stats.network.active}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Passive: {stats.network.passive}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Fails: {stats.network.fails}
                        </Text>
                        <Text size="sm" color="dimmed">
                            Ifaces: {stats.network.interfaces}
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Text size="sm" color="dimmed" mb={5}>
                        Network speed history
                    </Text>
                    <LineChart
                        h={150}
                        data={netChartData}
                        dataKey="time"
                        series={[
                            { name: 'rx', label: 'Rx speed', color: 'green.5' },
                            { name: 'tx', label: 'Tx speed', color: 'orange.5' },
                        ]}
                        xAxisProps={{ tickFormatter: formatTimeTick }}
                        yAxisProps={{ domain: ['auto', 'auto'] }}
                    />
                </Card>

                <Card radius="md" withBorder p="md">
                    <Group justify="space-between" align="center" mb="xs">
                        <Group align="center">
                            <IconDatabase size={28} />
                            <Text size="xl" fw={700}>
                                {stats.filesystem.used}M / {stats.filesystem.total}M
                            </Text>
                        </Group>
                        <Text size="sm" color="dimmed">
                            {stats.filesystem.name}
                        </Text>
                    </Group>

                    <Divider my="xs" />

                    <Progress value={fsUsedPercent} color="red" size="lg" radius="lg" />
                    <Text mt="sm" color="dimmed" size="sm">
                        {Math.round(fsUsedPercent)}%
                    </Text>
                </Card>
            </SimpleGrid>
        </Container>
    )
}

export default SystemDashboard