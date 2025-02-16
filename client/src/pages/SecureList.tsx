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
} from '@mantine/core'
import {
    IconTrash,
    IconPlus,
    IconChevronUp,
    IconChevronDown,
    IconSelector,
} from '@tabler/icons-react'
import {
    getSecureList,
    addDomain,
    deleteDomain,
    clearForce,
} from '../api/routerApi'

// Функция для определения сервиса по домену (пример)
const getServiceForDomain = (domain: string): string => {
    const mapping: Record<string, string> = {
        'google.com': 'Google',
        'facebook.com': 'Facebook',
        'twitter.com': 'Twitter',
        'github.com': 'GitHub',
        'amazon.com': 'Amazon',
        'yahoo.com': 'Yahoo',
        'example.com': 'Example Service',
    }
    for (const key in mapping) {
        if (domain.toLowerCase().includes(key)) {
            return mapping[key]
        }
    }
    return 'Неизвестно'
}

interface DomainItem {
    id: string
    domain: string
    processing?: boolean
}

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
                <Table.Td style={{ width: 40 }}>
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
                <Table.Td style={{ width: 40, textAlign: 'center' }}>
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
                <Group gap='sm' grow>
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

    // Состояния для сортировки: sortBy может быть 'domain' или 'service' или null (нет сортировки)
    // sortOrder: 'asc' или 'desc' или null
    const [sortBy, setSortBy] = useState<'domain' | 'service' | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

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

    // Функция для трёхсостоящей сортировки:
    // Если выбран столбец не совпадает с текущим — сортировка по возрастанию,
    // если уже 'asc' — меняем на 'desc',
    // если уже 'desc' — сбрасываем сортировку.
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
        return sortedDomains.map((item) => (
            <DomainRow
                key={item.id}
                item={item}
                isSelected={selectedRows.includes(item.id)}
                onToggle={handleToggleRowSelection}
                onDelete={handleDeleteDomain}
            />
        ))
    }, [sortedDomains, selectedRows, handleToggleRowSelection, handleDeleteDomain])

    return (
        <Container py="xl">
            <Title mb="md">Список доменов</Title>

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
                    style={{ flex: 1 }}
                    error={errorMessage || undefined}
                />
                <Button leftSection={<IconPlus size={16} />} onClick={() => addDomains(inputValue)}>
                    Добавить
                </Button>
            </Group>

            {loading ? (
                <Center>
                    <Stack align="center">
                        <Loader
                            size="xl"
                            type="dots"
                            color="blue"
                        />
                        <Text size="xl">Загрузка доменов...</Text>
                        <Text size="sm" c="dimmed">Пожалуйста, подождите, мы получаем данные.</Text>
                    </Stack>
                </Center>
            ) : domains.length === 0 ? (
                <Center>
                    <Stack align="center">
                        <Text size="xl">Пусто</Text>
                        <Text size="sm" c="dimmed">Добавьте новые домены, чтобы они появились здесь.</Text>
                    </Stack>
                </Center>
            ) : (
                <ScrollArea>
                    <Table highlightOnHover striped withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 40 }}>
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
                                <Table.Th style={{ width: 40 }} />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            )}

            <Transition mounted={selectedRows.length > 0} transition="slide-up" duration={200} timingFunction="ease">
                {(styles) => (
                    <Affix position={{ bottom: 20, right: 20 }}>
                        <Button style={styles} color="red" leftSection={<IconTrash size={16} />} onClick={deleteSelectedRows}>
                            Удалить выбранное
                        </Button>
                    </Affix>
                )}
            </Transition>
        </Container>
    )
}

export default SecureList
