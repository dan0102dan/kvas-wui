import React, { useEffect, useState } from 'react'
import {
    Container,
    Title,
    TextInput,
    Button,
    Group,
    Table,
    Checkbox,
    ActionIcon,
    Loader,
    Text,
} from '@mantine/core'
import {
    IconTrash,
    IconPlus,
    IconClearAll,
    IconChevronUp,
    IconChevronDown,
} from '@tabler/icons-react'
import {
    getSecureList,
    addDomain as apiAddDomain,
    deleteDomain as apiDeleteDomain,
    clearForce,
} from '../api/routerApi'

interface DomainItem {
    id: string
    domain: string
    processing?: boolean
    highlight?: boolean // для кратковременной подсветки (если это дубликат)
}

const DomainTable: React.FC = () => {
    const [domains, setDomains] = useState<DomainItem[]>([])
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Первичная загрузка списка доменов
    useEffect(() => {
        getSecureList()
            .then((data: string[]) => {
                const initial = data.map((d) => ({
                    id: d,
                    domain: d,
                    processing: false,
                    highlight: false,
                }))
                // Сортируем по возрастанию (по умолчанию)
                initial.sort((a, b) => a.domain.localeCompare(b.domain))
                setDomains(initial)
            })
            .catch((error) => {
                console.error('Ошибка при загрузке доменов:', error)
            })
            .finally(() => setLoading(false))
    }, [])

    // Добавление доменов (с проверкой на дубликаты)
    const addDomains = (input: string) => {
        setErrorMessage('')
        const trimmed = input.trim()
        if (!trimmed) return

        // Разбиваем текст по символам-разделителям
        const domainStrings = trimmed
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)

        if (domainStrings.length === 0) return

        // Проверяем, какие домены уже есть, а какие новые
        const duplicates: string[] = []
        const newEntries: DomainItem[] = []

        domainStrings.forEach((rawDomain) => {
            const lower = rawDomain.toLowerCase()
            const exists = domains.some(
                (item) => item.domain.toLowerCase() === lower
            )
            if (exists) {
                duplicates.push(rawDomain)
            } else {
                newEntries.push({
                    id: rawDomain,
                    domain: rawDomain,
                    processing: true,
                    highlight: false,
                })
            }
        })

        // Если есть дубликаты – показываем сообщение и подсвечиваем существующие
        if (duplicates.length > 0) {
            setErrorMessage(
                duplicates.length === 1
                    ? `Домен "${duplicates[0]}" уже есть в списке`
                    : `Несколько доменов уже есть в списке: ${duplicates.join(', ')}`
            )
            setDomains((prev) =>
                prev.map((item) =>
                    duplicates.some(
                        (dup) => dup.toLowerCase() === item.domain.toLowerCase()
                    )
                        ? { ...item, highlight: true }
                        : item
                )
            )
            setTimeout(() => {
                setDomains((prev) => prev.map((item) => ({ ...item, highlight: false })))
            }, 2000)
        }

        if (newEntries.length === 0) {
            setInputValue('')
            return
        }

        // Добавляем новые домены оптимистично
        setDomains((prev) => {
            const combined = [...prev, ...newEntries]
            combined.sort((a, b) =>
                sortOrder === 'asc'
                    ? a.domain.localeCompare(b.domain)
                    : b.domain.localeCompare(a.domain)
            )
            return combined
        })
        setInputValue('')

        // Вызываем API для каждого нового домена
        newEntries.forEach((entry) => {
            apiAddDomain(entry.domain)
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
    }

    // Сортировка по столбцу "Домен"
    const toggleSortOrder = () => {
        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
        setSortOrder(newOrder)
        setDomains((prev) =>
            [...prev].sort((a, b) =>
                newOrder === 'asc'
                    ? a.domain.localeCompare(b.domain)
                    : b.domain.localeCompare(a.domain)
            )
        )
    }

    // Обработка вставки
    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = event.clipboardData.getData('text')
        if (pastedText.match(/[\n,;]/)) {
            event.preventDefault()
            addDomains(pastedText)
        }
    }

    // Выделение / снятие выделения строки
    const toggleRowSelection = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    // Удаление выбранных строк
    const deleteSelectedRows = () => {
        selectedRows.forEach((id) => {
            setDomains((prev) =>
                prev.map((d) => (d.id === id ? { ...d, processing: true } : d))
            )
            apiDeleteDomain(id)
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

    // НОВЫЙ обработчик: очистка таблицы через kvas clear force
    const handleClearTable = () => {
        setLoading(true)
        clearForce()
            .then((res) => {
                console.log('Ответ от clear force:', res)
                // Если команда выполнена успешно, очищаем список
                setDomains([])
                setSelectedRows([])
            })
            .catch((error) => {
                console.error('Ошибка при очистке таблицы', error)
            })
            .finally(() => setLoading(false))
    }

    // Удаление одного домена
    const handleDeleteDomain = (item: DomainItem) => {
        setDomains((prev) =>
            prev.map((d) => (d.id === item.id ? { ...d, processing: true } : d))
        )
        apiDeleteDomain(item.domain)
            .then(() => {
                setDomains((prev) => prev.filter((d) => d.id !== item.id))
                setSelectedRows((prev) => prev.filter((x) => x !== item.id))
            })
            .catch((error) => {
                console.error('Ошибка при удалении домена', item.domain, error)
                setDomains((prev) =>
                    prev.map((d) => (d.id === item.id ? { ...d, processing: false } : d))
                )
            })
    }

    const rows = domains.map((item) => {
        const isSelected = selectedRows.includes(item.id)
        return (
            <Table.Tr
                key={item.id}
                bg={
                    item.processing
                        ? undefined
                        : isSelected
                            ? 'blue.0'
                            : item.highlight
                                ? 'red.0'
                                : undefined
                }
            >
                <Table.Td style={{ width: 40 }}>
                    <Checkbox
                        aria-label="Select row"
                        checked={isSelected}
                        disabled={item.processing}
                        onChange={() => toggleRowSelection(item.id)}
                    />
                </Table.Td>
                <Table.Td>{item.domain}</Table.Td>
                <Table.Td style={{ width: 40 }}>
                    {item.processing ? (
                        <Loader size="xs" />
                    ) : (
                        <ActionIcon color="red" onClick={() => handleDeleteDomain(item)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    )}
                </Table.Td>
            </Table.Tr>
        )
    })

    return (
        <Container py="xl">
            <Title mb="md">Список доменов</Title>

            <Group mb="md">
                <TextInput
                    placeholder="Введите домен или вставьте список..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.currentTarget.value)}
                    onPaste={handlePaste}
                    style={{ flex: 1 }}
                    error={errorMessage || undefined}
                />
                <Button leftSection={<IconPlus size={16} />} onClick={() => addDomains(inputValue)}>
                    Добавить
                </Button>
            </Group>

            {errorMessage && (
                <Text color="red" mb="md" size="sm">
                    {errorMessage}
                </Text>
            )}

            <Group mb="md">
                <Button
                    variant="outline"
                    color="red"
                    leftSection={<IconClearAll size={16} />}
                    onClick={handleClearTable}
                >
                    Очистить таблицу
                </Button>

                {selectedRows.length > 0 && (
                    <Button
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={deleteSelectedRows}
                    >
                        Удалить выбранное
                    </Button>
                )}
            </Group>

            {loading ? (
                <Text>Загрузка...</Text>
            ) : domains.length === 0 ? (
                <Text color="dimmed">Нет доменов</Text>
            ) : (
                <Table highlightOnHover striped withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 40 }} />
                            <Table.Th onClick={toggleSortOrder} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                Домен {sortOrder === 'asc' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                            </Table.Th>
                            <Table.Th style={{ width: 40 }}>Действия</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            )}
        </Container>
    )
}

export default DomainTable
