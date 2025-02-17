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
    IconInfoCircle,
} from '@tabler/icons-react'
import { useScrollIntoView } from '@mantine/hooks'
import { getSecureList, addDomain, deleteDomain, clearForce } from '../api/routerApi'
import { ALL_SERVICES } from '../utils'
import { useLang } from '../contexts'
import { showNotification } from '@mantine/notifications'

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
    return ''
}

// Расширенный интерфейс строки домена с опциональным ref
interface DomainRowProps {
    item: DomainItem
    isSelected: boolean
    onToggle: (id: string) => void
    onDelete: (id: string) => void
    rowRef?: React.Ref<HTMLTableRowElement>
}

const DomainRow: React.FC<DomainRowProps> = React.memo(
    ({ item, isSelected, onToggle, onDelete, rowRef }) => {
        const { t } = useLang()
        return (
            <Table.Tr ref={rowRef} bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}>
                <Table.Td>
                    <Checkbox
                        aria-label={t('pages.DomainList.checkbox.selectDomain')}
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
                <Table.Td align="right">
                    <Tooltip label={t('pages.DomainList.tooltip.deleteDomain')} withArrow position="top">
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
                <Group gap="xs">
                    <Text fw={500}>{children}</Text>
                    <Center>
                        <Icon size={16} stroke={1.5} />
                    </Center>
                </Group>
            </UnstyledButton>
        </Table.Th>
    )
}

const DomainList: React.FC = () => {
    const { t } = useLang()
    const [domains, setDomains] = useState<DomainItem[]>([])
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Состояния сортировки
    const [sortBy, setSortBy] = useState<'domain' | 'service' | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

    // Фильтрация по сервисам
    const [selectedServiceFilters, setSelectedServiceFilters] = useState<string[]>([])

    // Для скролла к только что добавленному элементу
    const { scrollIntoView, targetRef } = useScrollIntoView({ offset: 20 })
    const [lastAddedDomainId, setLastAddedDomainId] = useState<string | null>(null)

    useEffect(() => {
        getSecureList()
            .then((data: string[]) => {
                const initial = data.map((d) => ({
                    id: d,
                    domain: d,
                    processing: false,
                }))
                initial.sort((a, b) => a.domain.localeCompare(b.domain))
                setDomains(initial)
            })
            .catch((e) => {
                console.error(t('pages.DomainList.error.loadingDomains'), e)
                showNotification({
                    title: t('pages.DomainList.error.loadingDomains'),
                    message: e.message,
                    color: 'red',
                })
            })
            .finally(() => setLoading(false))
    }, [t])

    // Эффект для скролла до только что добавленного домена
    useEffect(() => {
        if (lastAddedDomainId) {
            scrollIntoView({ alignment: 'center' })
            setLastAddedDomainId(null)
        }
    }, [lastAddedDomainId, scrollIntoView])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.currentTarget.value
            setInputValue(value)
            const parts = value.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
            const duplicates = parts.filter((d) =>
                domains.some((item) => item.domain.toLowerCase() === d.toLowerCase())
            )

            if (duplicates.length > 0) {
                setErrorMessage(`"${duplicates.at(-1)}" ${t('pages.DomainList.error.duplicateSingle')}`)
            } else {
                setErrorMessage('')
            }
        },
        [domains, t]
    )

    const addDomains = useCallback(
        (input: string) => {
            const trimmed = input.trim()
            if (!trimmed) return

            const domainStrings = trimmed.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
            const newEntries: DomainItem[] = []
            domainStrings.forEach((rawDomain) => {
                const lower = rawDomain.toLowerCase()
                const exists = domains.some((item) => item.domain.toLowerCase() === lower)
                if (!exists) {
                    newEntries.push({
                        id: rawDomain,
                        domain: rawDomain,
                        processing: true,
                    })
                }
            })
            if (newEntries.length === 0) {
                // Показываем уведомление только если пользователь ввёл больше одного домена
                if (domainStrings.length > 1) {
                    showNotification({
                        title: t('pages.DomainList.error.duplicateAllTitle'),
                        message: `${t('pages.DomainList.error.duplicateAllMessage')} ${domainStrings.join(', ')}`,
                        color: 'red',
                    })
                }
                return
            }
            // Запоминаем ID последнего добавленного домена для скролла
            setLastAddedDomainId(newEntries[newEntries.length - 1].id)

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
                    .catch(() => {
                        setDomains((prev) => prev.filter((item) => item.id !== entry.id))
                    })
            })
        },
        [domains, sortBy, sortOrder, t]
    )

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

    const filteredDomains = useMemo(() => {
        if (selectedServiceFilters.length === 0) return sortedDomains
        return sortedDomains.filter((item) =>
            selectedServiceFilters.includes(getServiceForDomain(item.domain))
        )
    }, [sortedDomains, selectedServiceFilters])

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
        if (selectedRows.length === filteredDomains.length) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredDomains.map((d) => d.id))
        }
    }, [selectedRows, filteredDomains])

    const handleToggleRowSelection = useCallback((id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    const deleteSelectedRows = useCallback(() => {
        if (selectedRows.length === domains.length) {
            setLoading(true)
            clearForce()
                .then(() => {
                    setDomains([])
                    setSelectedRows([])
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
                    .catch(() => {
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
            .catch(() => {
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
                rowRef={item.id === lastAddedDomainId ? targetRef : undefined}
            />
        ))
    }, [filteredDomains, selectedRows, handleToggleRowSelection, handleDeleteDomain, lastAddedDomainId, targetRef])

    const handleToggleService = useCallback((serviceName: string) => {
        setSelectedServiceFilters((prev) =>
            prev.includes(serviceName)
                ? prev.filter((s) => s !== serviceName)
                : [...prev, serviceName]
        )
    }, [])

    const handleAddMissingRecommendedDomains = useCallback(() => {
        if (missingRecommendedDomains.length > 0) {
            addDomains(missingRecommendedDomains.join('\n'))
        }
    }, [missingRecommendedDomains, addDomains])

    const shouldAddRecommended = missingRecommendedDomains.length > 0 && inputValue.trim() === ''

    return (
        <Container py="xl">
            <Title mb="md">{t('pages.DomainList.title')}</Title>

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
                    placeholder={t('pages.DomainList.inputPlaceholder')}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            if (shouldAddRecommended) {
                                handleAddMissingRecommendedDomains()
                            } else {
                                addDomains(inputValue)
                            }
                        }
                    }}
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
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                        if (shouldAddRecommended) {
                            handleAddMissingRecommendedDomains()
                        } else {
                            addDomains(inputValue)
                        }
                    }}
                >
                    {shouldAddRecommended ? t('pages.DomainList.fillRecommended') : t('pages.DomainList.add')}
                </Button>
            </Group>

            {filteredDomains.length > 0 && missingRecommendedDomains.length > 0 && (
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title={t('pages.DomainList.missingAlert.title')}
                    color="blue"
                    mb="sm"
                >
                    {t('pages.DomainList.missingAlert.message')} {missingRecommendedDomains.join(', ')}.
                </Alert>
            )}

            {loading ? (
                <Center>
                    <Stack align="center">
                        <Loader size="xl" type="dots" color="blue" />
                        <Text size="xl">{t('pages.DomainList.loading')}</Text>
                        <Text size="sm" c="dimmed">
                            {t('pages.DomainList.loadingInfo')}
                        </Text>
                    </Stack>
                </Center>
            ) : domains.length === 0 ? (
                <Center>
                    <Stack align="center">
                        <Text size="xl">{t('pages.DomainList.emptyTitle')}</Text>
                        <Text size="sm" c="dimmed">
                            {t('pages.DomainList.emptySubtitle')}
                        </Text>
                    </Stack>
                </Center>
            ) : filteredDomains.length === 0 ? (
                <Center>
                    <Stack align="center">
                        <Text size="xl">{t('pages.DomainList.filter.emptyTitle')}</Text>
                        {selectedServiceFilters.length > 0 && missingRecommendedDomains.length > 0 ? (
                            <Button leftSection={<IconPlus size={16} />} onClick={handleAddMissingRecommendedDomains}>
                                {t('pages.DomainList.fillRecommended')}
                            </Button>
                        ) : (
                            <Text size="sm" c="dimmed">
                                {t('pages.DomainList.filter.emptySubtitle')}
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
                                        aria-label={t('pages.DomainList.checkbox.selectAll')}
                                        checked={selectedRows.length === domains.length && domains.length > 0}
                                        indeterminate={selectedRows.length > 0 && selectedRows.length < domains.length}
                                        onChange={toggleSelectAll}
                                    />
                                </Table.Th>
                                <Th
                                    sorted={sortBy === 'domain'}
                                    reversed={sortOrder === 'desc'}
                                    onSort={() => handleSort('domain')}
                                >
                                    {t('pages.DomainList.table.domain')}
                                </Th>
                                <Th
                                    sorted={sortBy === 'service'}
                                    reversed={sortOrder === 'desc'}
                                    onSort={() => handleSort('service')}
                                >
                                    {t('pages.DomainList.table.service')}
                                </Th>
                                <Table.Th />
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
                            {t('pages.DomainList.deleteSelected')}
                        </Button>
                    </Affix>
                )}
            </Transition>
        </Container>
    )
}

export default DomainList
