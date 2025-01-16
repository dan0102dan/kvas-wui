import type { LoaderFunction } from '@remix-run/node'
import { IconBrandInstagram, IconBrandTwitter, IconBrandYoutube } from '@tabler/icons-react'
import {
    ActionIcon,
    Button,
    Group,
    SimpleGrid,
    Text,
    Textarea,
    TextInput,
    Title,
    Box,
    Stack
} from '@mantine/core'
import { IconAt, IconMapPin, IconPhone, IconSun } from '@tabler/icons-react'

interface ContactIconProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
    icon: typeof IconSun
    title: React.ReactNode
    description: React.ReactNode
}

function ContactIcon({ icon: Icon, title, description, ...others }: ContactIconProps) {
    return (
        <div  {...others}>
            <Box mr="md">
                <Icon size={24} />
            </Box>

            <div>
                <Text size="xs" >
                    {title}
                </Text>
                <Text>{description}</Text>
            </div>
        </div >
    )
}

const MOCKDATA = [
    { title: 'Email', description: 'hello@mantine.dev', icon: IconAt },
    { title: 'Phone', description: '+49 (800) 335 35 35', icon: IconPhone },
    { title: 'Address', description: '844 Morris Park avenue', icon: IconMapPin },
    { title: 'Working hours', description: '8 a.m. – 11 p.m.', icon: IconSun },
]

const social = [IconBrandTwitter, IconBrandYoutube, IconBrandInstagram]

export const loader: LoaderFunction = async ({ request }) => {
    return null
}

export default function ContactUs() {
    const icons = social.map((Icon, index) => (
        <ActionIcon key={index} size={28} variant="transparent">
            <Icon size={22} stroke={1.5} />
        </ActionIcon>
    ))

    return (
        <div >
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={50}>
                <div>
                    <Title >Contact us</Title>
                    <Text mt="sm" mb={30}>
                        Leave your email and we will get back to you within 24 hours
                    </Text>

                    <Stack>
                        {MOCKDATA.map((item, index) => <ContactIcon key={index} {...item} />)}
                    </Stack>

                    <Group mt="xl">{icons}</Group>
                </div>
                <div >
                    <TextInput
                        label="Email"
                        placeholder="your@email.com"
                        required
                    />
                    <TextInput
                        label="Name"
                        placeholder="John Doe"
                        mt="md"
                    />
                    <Textarea
                        required
                        label="Your message"
                        placeholder="I want to order your goods"
                        minRows={4}
                        mt="md"
                    />

                    <Group justify="flex-end" mt="md">
                        <Button >Send message</Button>
                    </Group>
                </div>
            </SimpleGrid>
        </div>
    )
}