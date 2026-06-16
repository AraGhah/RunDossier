import { createContext, useContext, useMemo, useState } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

const SUPPORTED_LANGS = ['en', 'fr']

function normalizeLang(code) {
  if (!code) return 'en'
  const c = String(code).toLowerCase()
  return SUPPORTED_LANGS.includes(c) ? c : 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => normalizeLang(localStorage.getItem('dossier-lang')))

  const setLanguage = (code) => {
    const next = normalizeLang(code)
    setLang(next)
    localStorage.setItem('dossier-lang', next)
  }

  const t = useMemo(() => {
    return (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key
  }, [lang])

  return <LanguageContext.Provider value={{ lang, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  return useContext(LanguageContext)
}
