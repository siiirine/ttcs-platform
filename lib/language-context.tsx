'use client'

// lib/language-context.tsx — Contexte global de langue FR/EN

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Lang } from './i18n'
import { t as translate, translations } from './i18n'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (section: keyof typeof translations, key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (section, key) => key,
})

const STORAGE_KEY = 'ttcs-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  // Charge la langue sauvegardée au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved === 'fr' || saved === 'en') setLangState(saved)
    } catch { /* ignore */ }
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch { /* ignore */ }
  }

  const tFn = (section: keyof typeof translations, key: string) =>
    translate(section, key, lang)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}