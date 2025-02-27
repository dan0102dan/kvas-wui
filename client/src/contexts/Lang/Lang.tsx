import React, { createContext, useContext, useState } from 'react'
import { ja, en, fr, ge, sp, po, ru, ch } from './translations'

const translations = { ja, en, fr, ge, sp, po, ru, ch }

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
    const getDefaultLang = (): Lang => {
        const storedLang = localStorage.getItem('lang') as Lang | null
        if (storedLang && availableTranslations.includes(storedLang)) {
            return storedLang
        }

        return 'ru'
    }

    const [lang, setLangState] = useState<Lang>(getDefaultLang())

    const setLang = (newLang: Lang) => {
        setLangState(newLang)
        localStorage.setItem('lang', newLang)
    }

    const t = (path: string): string => {
        const parts = path.split('.')
        let result: any = translations[lang]
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
