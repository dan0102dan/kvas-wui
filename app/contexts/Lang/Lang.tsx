import React, { createContext, useContext, useState, useEffect } from 'react'
import ru from './ru.json'

// импортируем все переводы, но не загружаем их сразу
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
    const [lang, setLangState] = useState<Lang>('ru')
    const [currentTranslations, setCurrentTranslations] = useState<any>({})

    useEffect(() => {
        translations[lang]().then((module) => {
            setCurrentTranslations(module.default)
        })
    }, [lang])

    const setLang = (newLang: Lang) => {
        setLangState(newLang)
    }

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
