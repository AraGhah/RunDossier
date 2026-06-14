import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('dossier-lang') || 'en')

  const setLanguage = (code) => {
    setLang(code)
    localStorage.setItem('dossier-lang', code)
  }

  const t = (key) => translations[lang]?.[key] ?? translations['en'][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
