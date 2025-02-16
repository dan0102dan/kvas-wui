import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
    Container,
    Title,
    TextInput,
    Button,
    Group,
    Stack,
    Table,
    Checkbox,
    ActionIcon,
    Text,
    ScrollArea,
    Tooltip,
    Center,
    Loader,
    Affix,
    Transition,
    UnstyledButton,
    Alert,
} from '@mantine/core'
import {
    IconTrash,
    IconPlus,
    IconChevronUp,
    IconChevronDown,
    IconSelector,
    IconInfoCircle
} from '@tabler/icons-react'
import {
    getSecureList,
    addDomain,
    deleteDomain,
    clearForce,
} from '../api/routerApi'
import { ALL_SERVICES } from '../utils'

// Интерфейс для домена
interface DomainItem {
    id: string
    domain: string
    processing?: boolean
}

// Функция для определения сервиса по домену
const getServiceForDomain = (domain: string): string => {
    const lowerDomain = domain.toLowerCase()
    for (const service of ALL_SERVICES) {
        if (service.domainPatterns.some((pattern) => lowerDomain.endsWith(pattern))) {
            return service.name
        }
    }
    return 'Неизвестно'
}

// Компонент строки таблицы доменов
interface DomainRowProps {
    item: DomainItem
    isSelected: boolean
    onToggle: (id: string) => void
    onDelete: (id: string) => void
}

const DomainRow: React.FC<DomainRowProps> = React.memo(
    ({ item, isSelected, onToggle, onDelete }) => {
        return (
            <Table.Tr bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}>
                <Table.Td>
                    <Checkbox
                        aria-label="Выбрать домен"
                        checked={isSelected}
                        disabled={item.processing}
                        onChange={() => onToggle(item.id)}
                    />
                </Table.Td>
                <Table.Td>
                    <Text>{item.domain}</Text>
                </Table.Td>
                <Table.Td>
                    <Text color="dimmed" size="sm">
                        {getServiceForDomain(item.domain)}
                    </Text>
                </Table.Td>
                <Table.Td align='right'>
                    <Tooltip label="Удалить домен" withArrow position="top">
                        <ActionIcon
                            color="red"
                            loading={item.processing}
                            onClick={() => onDelete(item.id)}
                            variant="light"
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Table.Td>
            </Table.Tr>
        )
    }
)

// Компонент заголовка таблицы с сортировкой
interface ThProps {
    children: React.ReactNode
    sorted: boolean
    reversed: boolean
    onSort: () => void
}

const Th: React.FC<ThProps> = ({ children, sorted, reversed, onSort }) => {
    const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector
    return (
        <Table.Th>
            <UnstyledButton onClick={onSort}>
                <Group gap="sm" grow>
                    <Text fw={500} fz="sm">
                        {children}
                    </Text>
                    <Center>
                        <Icon size={16} stroke={1.5} />
                    </Center>
                </Group>
            </UnstyledButton>
        </Table.Th>
    )
}

const SecureList: React.FC = () => {
    const [domains, setDomains] = useState<DomainItem[]>([])
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Состояния сортировки
    const [sortBy, setSortBy] = useState<'domain' | 'service' | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

    // Состояние фильтрации по сервису (имена сервисов)
    const [selectedServiceFilters, setSelectedServiceFilters] = useState<string[]>([])

    useEffect(() => {
        getSecureList()
            .then((data: string[]) => {
                const initial = data.map((d) => ({
                    id: d,
                    domain: d,
                    processing: false,
                }))
                // Первичная сортировка по домену
                initial.sort((a, b) => a.domain.localeCompare(b.domain))
                setDomains(initial)
            })
            .catch((error) => {
                console.error('Ошибка при загрузке доменов:', error)
            })
            .finally(() => setLoading(false))
    }, [])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.currentTarget.value
            setInputValue(value)
            const parts = value
                .split(/[\n,;]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            const duplicates = parts.filter((d) =>
                domains.some((item) => item.domain.toLowerCase() === d.toLowerCase())
            )
            if (duplicates.length > 0) {
                setErrorMessage(
                    duplicates.length === 1
                        ? `Домен "${duplicates[0]}" уже есть в списке`
                        : `Домены ${duplicates.join(', ')} уже есть в списке`
                )
            } else {
                setErrorMessage('')
            }
        },
        [domains]
    )

    const addDomains = useCallback(
        (input: string) => {
            const trimmed = input.trim()
            if (!trimmed) return

            const domainStrings = trimmed
                .split(/[\n,;]+/)
                .map((s) => s.trim())
                .filter(Boolean)

            const newEntries: DomainItem[] = []
            domainStrings.forEach((rawDomain) => {
                const lower = rawDomain.toLowerCase()
                const exists = domains.some(
                    (item) => item.domain.toLowerCase() === lower
                )
                if (!exists) {
                    newEntries.push({
                        id: rawDomain,
                        domain: rawDomain,
                        processing: true,
                    })
                }
            })

            if (newEntries.length === 0) return

            setDomains((prev) => {
                const combined = [...prev, ...newEntries]
                if (sortBy) {
                    combined.sort((a, b) => {
                        let aVal: string, bVal: string
                        if (sortBy === 'domain') {
                            aVal = a.domain
                            bVal = b.domain
                        } else {
                            aVal = getServiceForDomain(a.domain)
                            bVal = getServiceForDomain(b.domain)
                        }
                        const cmp = aVal.localeCompare(bVal)
                        return sortOrder === 'desc' ? -cmp : cmp
                    })
                } else {
                    combined.sort((a, b) => a.domain.localeCompare(b.domain))
                }
                return combined
            })
            setInputValue('')
            setErrorMessage('')

            newEntries.forEach((entry) => {
                addDomain(entry.domain)
                    .then(() => {
                        setDomains((prev) =>
                            prev.map((item) =>
                                item.id === entry.id ? { ...item, processing: false } : item
                            )
                        )
                    })
                    .catch((error) => {
                        console.error('Ошибка при добавлении домена', entry.domain, error)
                        setDomains((prev) => prev.filter((item) => item.id !== entry.id))
                    })
            })
        },
        [domains, sortBy, sortOrder]
    )

    // Обработчик сортировки по столбцу
    const handleSort = useCallback(
        (column: 'domain' | 'service') => {
            if (sortBy !== column) {
                setSortBy(column)
                setSortOrder('asc')
            } else if (sortOrder === 'asc') {
                setSortOrder('desc')
            } else {
                setSortBy(null)
                setSortOrder(null)
            }
        },
        [sortBy, sortOrder]
    )

    // Сортировка доменов
    const sortedDomains = useMemo(() => {
        if (!sortBy) return domains
        const sorted = [...domains].sort((a, b) => {
            let aVal: string, bVal: string
            if (sortBy === 'domain') {
                aVal = a.domain
                bVal = b.domain
            } else {
                aVal = getServiceForDomain(a.domain)
                bVal = getServiceForDomain(b.domain)
            }
            const cmp = aVal.localeCompare(bVal)
            return sortOrder === 'desc' ? -cmp : cmp
        })
        return sorted
    }, [domains, sortBy, sortOrder])

    // Фильтрация доменов по выбранным сервисам
    const filteredDomains = useMemo(() => {
        if (selectedServiceFilters.length === 0) return sortedDomains
        return sortedDomains.filter((item) =>
            selectedServiceFilters.includes(getServiceForDomain(item.domain))
        )
    }, [sortedDomains, selectedServiceFilters])

    // Вычисляем рекомендуемые домены, которых ещё нет в списке для выбранных сервисов
    const missingRecommendedDomains = useMemo(() => {
        if (selectedServiceFilters.length === 0) return []
        const missing: string[] = []
        selectedServiceFilters.forEach((serviceName) => {
            const serviceData = ALL_SERVICES.find((s) => s.name === serviceName)
            if (serviceData) {
                serviceData.domainPatterns.forEach((pattern) => {
                    if (!domains.some((d) => d.domain.toLowerCase() === pattern.toLowerCase())) {
                        missing.push(pattern)
                    }
                })
            }
        })
        return Array.from(new Set(missing))
    }, [selectedServiceFilters, domains])

    const toggleSelectAll = useCallback(() => {
        if (selectedRows.length === domains.length) {
            setSelectedRows([])
        } else {
            setSelectedRows(domains.map((d) => d.id))
        }
    }, [selectedRows, domains])

    const handleToggleRowSelection = useCallback((id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    const deleteSelectedRows = useCallback(() => {
        if (selectedRows.length === domains.length) {
            setLoading(true)
            clearForce()
                .then((res) => {
                    console.log('Ответ от clearForce:', res)
                    setDomains([])
                    setSelectedRows([])
                })
                .catch((error) => {
                    console.error('Ошибка при очистке таблицы', error)
                })
                .finally(() => setLoading(false))
        } else {
            selectedRows.forEach((id) => {
                setDomains((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, processing: true } : d))
                )
                deleteDomain(id)
                    .then(() => {
                        setDomains((prev) => prev.filter((dom) => dom.id !== id))
                        setSelectedRows((prev) => prev.filter((x) => x !== id))
                    })
                    .catch((error) => {
                        console.error('Ошибка при удалении домена', id, error)
                        setDomains((prev) =>
                            prev.map((dom) =>
                                dom.id === id ? { ...dom, processing: false } : dom
                            )
                        )
                    })
            })
        }
    }, [selectedRows, domains])

    const handleDeleteDomain = useCallback((id: string) => {
        setDomains((prev) =>
            prev.map((d) => (d.id === id ? { ...d, processing: true } : d))
        )
        deleteDomain(id)
            .then(() => {
                setDomains((prev) => prev.filter((d) => d.id !== id))
                setSelectedRows((prev) => prev.filter((x) => x !== id))
            })
            .catch((error) => {
                console.error('Ошибка при удалении домена', id, error)
                setDomains((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, processing: false } : d))
                )
            })
    }, [])

    const rows = useMemo(() => {
        return filteredDomains.map((item) => (
            <DomainRow
                key={item.id}
                item={item}
                isSelected={selectedRows.includes(item.id)}
                onToggle={handleToggleRowSelection}
                onDelete={handleDeleteDomain}
            />
        ))
    }, [filteredDomains, selectedRows, handleToggleRowSelection, handleDeleteDomain])

    // Обработчик клика по кнопке сервиса (фильтрация)
    const handleToggleService = useCallback((serviceName: string) => {
        setSelectedServiceFilters((prev) =>
            prev.includes(serviceName)
                ? prev.filter((s) => s !== serviceName)
                : [...prev, serviceName]
        )
    }, [])

    // Обработчик для добавления всех недостающих рекомендуемых доменов
    const handleAddMissingRecommendedDomains = useCallback(() => {
        if (missingRecommendedDomains.length > 0) {
            addDomains(missingRecommendedDomains.join('\n'))
        }
    }, [missingRecommendedDomains, addDomains])

    return (
        <Container py="xl">
            <Title mb="md">Список доменов</Title>

            {/* Панель фильтрации по сервису */}
            <Group mb="md">
                {ALL_SERVICES.map((service) => {
                    const IconComp = service.icon
                    const isActive = selectedServiceFilters.includes(service.name)
                    return (
                        <Button
                            key={service.name}
                            variant={isActive ? 'filled' : 'outline'}
                            color={isActive ? 'blue' : 'gray'}
                            leftSection={IconComp ? <IconComp size={16} /> : null}
                            onClick={() => handleToggleService(service.name)}
                        >
                            {service.name}
                        </Button>
                    )
                })}
            </Group>

            <Group mb="md">
                <TextInput
                    placeholder="Введите домен или вставьте список..."
                    value={inputValue}
                    onChange={handleInputChange}
                    onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text')
                        if (pastedText.match(/[\n,;]/)) {
                            e.preventDefault()
                            addDomains(pastedText)
                        }
                    }}
                    flex={1}
                    error={errorMessage || undefined}
                />
                <Button leftSection={<IconPlus size={16} />} onClick={() => addDomains(inputValue)}>
                    {missingRecommendedDomains.length > 0 && inputValue.trim() === '' ? 'Дополнить рекомендуемыми' : 'Добавить'}
                </Button>
            </Group>

            {/* Если список доменов (после фильтрации) НЕ пуст, но отсутствуют рекомендуемые домены – показываем уведомление */}
            {filteredDomains.length > 0 && missingRecommendedDomains.length > 0 && (
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="Дополните список"
                    color="blue"
                    mb="sm"
                >
                    В вашем списке отсутствуют рекомендуемые домены: {missingRecommendedDomains.join(', ')}.
                </Alert>
            )}

            {loading ? (
                <Center>
                    <Stack align="center">
                        <Loader size="xl" type="dots" color="blue" />
                        <Text size="xl">Загрузка доменов...</Text>
                        <Text size="sm" c="dimmed">
                            Пожалуйста, подождите, мы получаем данные.
                        </Text>
                    </Stack>
                </Center>
            ) : domains.length === 0 ? (
                <Center>
                    <Stack align="center">
                        <Text size="xl">Пусто</Text>
                        <Text size="sm" c="dimmed">
                            Добавьте новые домены, чтобы они появились здесь.
                        </Text>
                    </Stack>
                </Center>
            ) : filteredDomains.length === 0 ? (
                <Center>
                    <Stack align="center">
                        <Text size="xl">Нет доменов для выбранного фильтра</Text>
                        {selectedServiceFilters.length > 0 && missingRecommendedDomains.length > 0 ? (
                            <Button leftSection={<IconPlus size={16} />} onClick={handleAddMissingRecommendedDomains}>
                                Добавить рекомендуемые домены
                            </Button>
                        ) : (
                            <Text size="sm" c="dimmed">
                                Попробуйте изменить фильтр или добавить домены вручную.
                            </Text>
                        )}
                    </Stack>
                </Center>
            ) : (
                <ScrollArea>
                    <Table highlightOnHover striped>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>
                                    <Checkbox
                                        aria-label="Выбрать все"
                                        checked={selectedRows.length === domains.length && domains.length > 0}
                                        indeterminate={
                                            selectedRows.length > 0 && selectedRows.length < domains.length
                                        }
                                        onChange={toggleSelectAll}
                                    />
                                </Table.Th>
                                <Th
                                    sorted={sortBy === 'domain'}
                                    reversed={sortOrder === 'desc'}
                                    onSort={() => handleSort('domain')}
                                >
                                    Домен
                                </Th>
                                <Th
                                    sorted={sortBy === 'service'}
                                    reversed={sortOrder === 'desc'}
                                    onSort={() => handleSort('service')}
                                >
                                    Сервис
                                </Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            )}

            <Transition
                mounted={selectedRows.length > 0}
                transition="slide-up"
                duration={200}
                timingFunction="ease"
            >
                {(styles) => (
                    <Affix position={{ bottom: 20, right: 20 }}>
                        <Button
                            style={styles}
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={deleteSelectedRows}
                        >
                            Удалить выбранное
                        </Button>
                    </Affix>
                )}
            </Transition>
        </Container>
    )
}

export default SecureList
