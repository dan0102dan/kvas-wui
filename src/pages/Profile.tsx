import { Container, Title, Text } from '@mantine/core'
import { useAuth } from '../contexts'

const ProfilePage: React.FC = () => {

    const { user } = useAuth()

    return (
        <Container>
            <Title order={2}>Личный кабинет</Title>
            <Text mt="md">
                Вы авторизованы как: <b>{user?.email}</b>
            </Text>
            <Text>
                Ваш uniqueKey: <b>{user?.uniqueKey}</b>
            </Text>
            <Text>userType: <b>{user?.type}</b></Text>

            {/* Просто покажем все поля */}
            {Object.entries(user ?? {}).map(([k, v]) => (
                <Text key={k}>{k}: <b>{String(v)}</b></Text>
            ))}
        </Container>
    )
}

export default ProfilePage
