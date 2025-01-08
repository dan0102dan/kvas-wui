import { Container, Text } from '@mantine/core'
import { useLang } from '../contexts'

export default function Settings() {
    const { t } = useLang()

    return (
        <Container>
            <Text>{t('pages.Setup.content')}</Text>
            {/* Добавьте содержимое страницы настроек */}
        </Container>
    )
}
