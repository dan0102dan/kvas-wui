import React, { useEffect, useState } from 'react'
import {
    Container,
    Title,
    Text,
    Select,
    Switch,
    Group,
    Card,
    Badge,
    Loader,
    Space,
} from '@mantine/core'

type DNSOption = {
    value: string
    label: string
}

type VPNOption = {
    value: string
    label: string
}

// Mock function to get internet connection status
const fetchInternetStatus = (): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Randomly resolve to true or false for demonstration
            const isConnected = Math.random() > 0.3
            resolve(isConnected)
        }, 1000)
    })
}

const dnsOptions: DNSOption[] = [
    { value: 'google', label: 'Google DNS (8.8.8.8)' },
    { value: 'cloudflare', label: 'Cloudflare DNS (1.1.1.1)' },
    { value: 'openDNS', label: 'OpenDNS (208.67.222.222)' },
]

const vpnOptions: VPNOption[] = [
    { value: 'expressvpn', label: 'ExpressVPN' },
    { value: 'nordvpn', label: 'NordVPN' },
    { value: 'surfshark', label: 'Surfshark' },
]

const Setup: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(null)
    const [selectedDNS, setSelectedDNS] = useState<string | null>(null)
    const [selectedVPN, setSelectedVPN] = useState<string | null>(null)
    const [vpnEnabled, setVpnEnabled] = useState<boolean>(false)

    useEffect(() => {
        // Fetch internet connection status on component mount
        fetchInternetStatus().then((status) => setIsConnected(status))
    }, [])

    return (
        <Container size="sm" p="md">
            <Title order={2}>
                Router Setup
            </Title>

            <Card shadow="sm" padding="lg" mt="md">
                <Group p="apart" mb="xs">
                    <Text fw={500}>Internet Connection Status</Text>
                    {isConnected === null ? (
                        <Loader size="sm" />
                    ) : isConnected ? (
                        <Badge color="green" variant="light">
                            Connected
                        </Badge>
                    ) : (
                        <Badge color="red" variant="light">
                            Disconnected
                        </Badge>
                    )}
                </Group>
                <Space h="md" />

                <Select
                    label="Select DNS Provider"
                    placeholder="Pick a DNS provider"
                    data={dnsOptions}
                    value={selectedDNS}
                    onChange={setSelectedDNS}
                    required
                />

                <Space h="md" />

                <Group p="apart" align="center">
                    <Text fw={500}>Enable VPN</Text>
                    <Switch checked={vpnEnabled} onChange={(event) => setVpnEnabled(event.currentTarget.checked)} />
                </Group>

                {vpnEnabled && (
                    <>
                        <Space h="md" />
                        <Select
                            label="Select VPN Service"
                            placeholder="Pick a VPN service"
                            data={vpnOptions}
                            value={selectedVPN}
                            onChange={setSelectedVPN}
                            required
                        />
                    </>
                )}

                <Space h="md" />

                {/* Add more router settings here */}
            </Card>
        </Container>
    )
}

export default Setup
