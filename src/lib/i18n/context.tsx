'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { translations, type Locale } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key: string) => key,
})

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('greenfield-locale') as Locale | null
    if (saved && (saved === 'en' || saved === 'fr')) {
      return saved
    }
  }
  return 'fr'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('greenfield-locale', newLocale)
  }, [])

  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    let current: Record<string, unknown> = translations[locale] as Record<string, unknown>
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        // Fallback to English
        let fallback: Record<string, unknown> = translations.en as Record<string, unknown>
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk]
          } else {
            return key // Return the key itself if not found
          }
        }
        return typeof fallback === 'string' ? fallback : key
      }
    }
    return typeof current === 'string' ? current : key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}

export { type Locale }
