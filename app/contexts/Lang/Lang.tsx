import React, { createContext, useContext, useState, useEffect } from 'react'
import ru from './ru.json'

// Импортируем все переводы, но не загружаем их сразу
const translations = {
    ru: () => Promise.resolve({ default: ru }),
    en: () => import('./en.json'),
}

export type Lang = keyof typeof translations

export const availableTranslations = Object.keys(translations) as Array<Lang>

const LangContext = createContext<{
    lang: Lang
    setLang: (lang: Lang) => void
    t: (path: string) => string
}>({
    lang: 'ru',
    setLang: () => { },
    t: (key) => key,
})

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    /**
     * Получаем язык по умолчанию
     * @returns {Lang} Язык по умолчанию
     */
    const getDefaultLang = (): Lang => {
        if (typeof window === 'undefined') {
            return 'ru'
        }
        // Проверяем, есть ли в localStorage сохранённый язык
        const storedLang = localStorage.getItem('lang') as Lang | null
        if (storedLang && availableTranslations.includes(storedLang)) {
            return storedLang
        }
        // Если в localStorage нет сохранённого языка, берём язык браузера (например, "en" из "en-US")
        const browserLang = navigator.language.slice(0, 2)
        if (availableTranslations.includes(browserLang as Lang)) {
            return browserLang as Lang
        }
        // Если ни один вариант не подошёл — используем язык по умолчанию
        return 'ru'
    }

    const [lang, setLangState] = useState<Lang>(getDefaultLang())
    const [currentTranslations, setCurrentTranslations] = useState<any>({})

    /**
     * Загружаем переводы для текущего языка
     */
    useEffect(() => {
        translations[lang]().then((module) => {
            setCurrentTranslations(module.default)
        })
    }, [lang])

    /**
     * Устанавливаем новый язык
     * @param {Lang} newLang Новый язык
     */
    const setLang = (newLang: Lang) => {
        setLangState(newLang)
        localStorage.setItem('lang', newLang)
    }

    /**
     * Получаем перевод по ключу
     * @param {string} path Путь к переводу через точку
     * @returns {string} Перевод
     * @example 
     * t('pages.Home.project') // => "Проект «Kvas Pro»"
     */
    const t = (path: string): string => {
        const parts = path.split('.')
        let result = currentTranslations
        for (const part of parts) {
            if (!result[part]) return path
            result = result[part]
        }
        return result
    }

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    )
}

export const useLang = () => useContext(LangContext)
