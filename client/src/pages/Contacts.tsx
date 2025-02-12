import React from 'react'
import {
    Container,
    Group,
    Flex,
    Stack,
    Text,
    Title,
    Box,
    ThemeIcon,
} from '@mantine/core'
import { IconAt, IconPhone, IconClockHour8 } from '@tabler/icons-react'
import { useLang } from '../contexts'

const Contacts: React.FC = () => {
    const { t } = useLang()

    return (
        <Container size="sm" p="xl">
            <Title order={2} mb="md">
                {t('pages.Contacts.title')}
            </Title>

            <Text mb="xl" c="dimmed">
                {t('pages.Contacts.description')}
            </Text>

            <Flex
                gap="sm"
                justify="space-evenly"
                align="flex-end"
                direction="row"
                wrap="wrap-reverse"
            >
                {/* Левая колонка (контактная информация) */}
                <Box p="sm">
                    <Stack>
                        {[
                            {
                                icon: <IconAt size={18} />,
                                title: t('pages.Contacts.contactEmail'),
                                description: 'team@kvas.pro',
                            },
                            {
                                icon: <IconPhone size={18} />,
                                title: t('pages.Contacts.contactPhone'),
                                description: '+7 (800) 335 35 35',
                            },
                            {
                                icon: <IconClockHour8 size={18} />,
                                title: t('pages.Contacts.workingHours'),
                                description: '8:00 – 20:00',
                            },
                        ].map((item, index) => (
                            <Group key={index} align="flex-start">
                                <ThemeIcon color="blue">{item.icon}</ThemeIcon>
                                <Box>
                                    <Text fw={500} size="sm">
                                        {item.title}
                                    </Text>
                                    <Text size="sm">{item.description}</Text>
                                </Box>
                            </Group>
                        ))}
                    </Stack>
                </Box>
            </Flex>
        </Container>
    )
}

export default Contacts
