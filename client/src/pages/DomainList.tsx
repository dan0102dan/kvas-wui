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
import { useScrollIntoView } from '@mantine/hooks'
import { getSecureList, addDomain, deleteDomain, clearForce } from '../api/routerApi'
import { useLang } from '../contexts'
import { showNotification } from '@mantine/notifications'

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
                <Table.Td align="right">
                    <ActionIcon
                        color={item.processing ? 'blue' : 'red'}
                        loading={item.processing}
                        onClick={() => onDelete(item.id)}
                        variant="light"
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
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
                <Group gap="xs" wrap="nowrap">
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

    const [sortBy, setSortBy] = useState<'domain' | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

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

    useEffect(() => {
        if (lastAddedDomainId) {
            scrollIntoView({ alignment: 'center' })
            setLastAddedDomainId(null)
        }
    }, [lastAddedDomainId, scrollIntoView])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.currentTarget.value.trim()
            setInputValue(value)

            if (!value) {
                setErrorMessage('')
                return
            }

            const lowerValue = value.toLowerCase()
            const duplicateExists = domains.some(
                (item) => item.domain.toLowerCase() === lowerValue
            )
            if (duplicateExists) {
                setErrorMessage(`"${value}" ${t('pages.DomainList.error.duplicate')}`)
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
                if (domainStrings.length > 1) {
                    showNotification({
                        title: t('pages.DomainList.error.duplicateAllTitle'),
                        message: `${t('pages.DomainList.error.duplicateAllMessage')} ${domainStrings.join(', ')}`,
                        color: 'red',
                    })
                }
                return
            }
            setLastAddedDomainId(newEntries[newEntries.length - 1].id)

            setDomains((prev) => {
                const combined = [...prev, ...newEntries]
                if (sortBy === 'domain') {
                    combined.sort((a, b) => {
                        const cmp = a.domain.localeCompare(b.domain)
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

    const handleSort = useCallback(() => {
        if (sortBy !== 'domain') {
            setSortBy('domain')
            setSortOrder('asc')
        } else if (sortOrder === 'asc') {
            setSortOrder('desc')
        } else {
            setSortBy(null)
            setSortOrder(null)
        }
    }, [sortBy, sortOrder])

    const sortedDomains = useMemo(() => {
        if (sortBy === 'domain') {
            return [...domains].sort((a, b) => {
                const cmp = a.domain.localeCompare(b.domain)
                return sortOrder === 'desc' ? -cmp : cmp
            })
        }
        return [...domains].sort((a, b) => a.domain.localeCompare(b.domain))
    }, [domains, sortBy, sortOrder])

    const toggleSelectAll = useCallback(() => {
        if (selectedRows.length === sortedDomains.length) {
            setSelectedRows([])
        } else {
            setSelectedRows(sortedDomains.map((d) => d.id))
        }
    }, [selectedRows, sortedDomains])

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
        return sortedDomains.map((item) => (
            <DomainRow
                key={item.id}
                item={item}
                isSelected={selectedRows.includes(item.id)}
                onToggle={handleToggleRowSelection}
                onDelete={handleDeleteDomain}
                rowRef={item.id === lastAddedDomainId ? targetRef : undefined}
            />
        ))
    }, [sortedDomains, selectedRows, handleToggleRowSelection, handleDeleteDomain, lastAddedDomainId, targetRef])

    return (
        <Container py="xl">
            <Title mb="md">{t('pages.DomainList.title')}</Title>

            <Group mb="md">
                <TextInput
                    placeholder={t('pages.DomainList.inputPlaceholder')}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addDomains(inputValue)
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
                <Button leftSection={<IconPlus size={16} />} onClick={() => addDomains(inputValue)}>
                    {t('pages.DomainList.add')}
                </Button>
            </Group>

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
            ) : (
                <ScrollArea>
                    <Table highlightOnHover striped>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>
                                    <Checkbox
                                        aria-label={t('pages.DomainList.checkbox.selectAll')}
                                        checked={selectedRows.length === sortedDomains.length && sortedDomains.length > 0}
                                        indeterminate={
                                            selectedRows.length > 0 && selectedRows.length < sortedDomains.length
                                        }
                                        onChange={toggleSelectAll}
                                    />
                                </Table.Th>
                                <Th sorted={sortBy === 'domain'} reversed={sortOrder === 'desc'} onSort={handleSort}>
                                    {t('pages.DomainList.table.domain')}
                                </Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            )}

            <Transition
                mounted={
                    selectedRows.length > 0 &&
                    !selectedRows.some((id) => {
                        const domain = domains.find((item) => item.id === id)
                        return domain?.processing
                    })
                }
                transition="slide-up"
                duration={200}
                timingFunction="ease"
            >
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
