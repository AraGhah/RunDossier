import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../context/LanguageContext'
import FlagIcon from './FlagIcon'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]

export default function Nav() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const location = useLocation()
  const { t } = useTranslation()

  const links = [
    { label: t('nav.howItWorks'), to: '/#how-it-works' },
    { label: t('nav.examples'),   to: '/#examples' },
    { label: t('nav.pricing'),    to: '/pricing' },
    { label: t('nav.about'),      to: '/about' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      {/* Progress bar */}
      <ScrollProgress />

      {/* Floating pill nav */}
      <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2.5rem)] max-w-5xl">
        <div className={`flex items-center justify-between gap-2 sm:gap-3 rounded-full border px-3 sm:px-5 py-2 sm:py-2.5
          transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${scrolled
            ? 'bg-cream/95 backdrop-blur-xl border-border-2 shadow-float'
            : 'bg-cream/80 backdrop-blur-md border-border'
          }`}>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => window.scrollTo({ top: 0, left: 0 })}
          >
            <span className="w-6 h-6 rounded-md bg-navy flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse-dot" />
            </span>
            <span className="font-display font-semibold text-navy text-[0.85rem] sm:text-[0.95rem] tracking-tight">
              Dossier
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <NavLink key={l.label} to={l.to}>{l.label}</NavLink>
            ))}
          </nav>

          {/* CTAs + Lang */}
          <div className="hidden md:flex items-center gap-2">
            <LangSwitcher />
            <Link to="/free-lines"
              className="text-[0.8rem] font-semibold text-navy px-4 py-2 rounded-full border border-navy/20
                hover:bg-navy/5 transition-colors duration-200">
              {t('nav.freeLines')}
            </Link>
            <Link to="/book-call"
              className="inline-flex items-center gap-2 bg-navy text-white text-[0.8rem] font-semibold
                px-4 pr-2 py-2 rounded-full shadow-cta hover:bg-navy-2 hover:shadow-cta-hover
                transition-all duration-200 group">
              {t('nav.bookCall')}
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center
                group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px]"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className={`w-4.5 h-[1.5px] bg-ink rounded-full transition-all duration-300 ${menuOpen ? 'translate-y-[3.25px] rotate-45' : ''}`} style={{width:'18px'}} />
            <span className={`h-[1.5px] bg-ink rounded-full transition-all duration-300 ${menuOpen ? '-translate-y-[3.25px] -rotate-45' : ''}`} style={{width:'18px'}} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-cream/97 backdrop-blur-2xl flex flex-col items-center justify-center gap-2"
          >
            {links.map((l, i) => (
              <motion.div
                key={l.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.1, duration: 0.45, ease: [0.32,0.72,0,1] }}
              >
                {l.to.startsWith('/#') ? (
                  <a href={l.to} className="font-display text-[clamp(1.75rem,8vw,2.5rem)] font-semibold text-ink hover:text-navy transition-colors block py-1.5 text-center">
                    {l.label}
                  </a>
                ) : (
                  <Link to={l.to} className="font-display text-[clamp(1.75rem,8vw,2.5rem)] font-semibold text-ink hover:text-navy transition-colors block py-1.5 text-center">
                    {l.label}
                  </Link>
                )}
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: links.length * 0.08 + 0.15, duration: 0.45, ease: [0.32,0.72,0,1] }}
              className="flex flex-col items-center gap-3 mt-6"
            >
              <LangSwitcher />
              <div className="flex gap-3">
                <Link to="/free-lines" className="px-6 py-3 rounded-full border border-navy/30 text-navy font-semibold text-sm">
                  {t('nav.freeLines')}
                </Link>
                <Link to="/book-call" className="px-6 py-3 rounded-full bg-navy text-white font-semibold text-sm shadow-cta">
                  {t('nav.bookCall')}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function LangSwitcher() {
  const { lang, setLanguage } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-muted px-3 py-2 rounded-full
          hover:bg-black/[0.04] hover:text-ink transition-all duration-200"
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FlagIcon code={current.code} />
        <span className="uppercase tracking-wide">{current.code}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.32,0.72,0,1] }}
            className="absolute top-full right-0 mt-2 bg-cream border border-border rounded-2xl shadow-card overflow-hidden z-50 min-w-[148px]"
          >
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => { setLanguage(l.code); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-medium text-left
                  transition-colors duration-150
                  ${l.code === lang
                    ? 'bg-navy/[0.06] text-navy font-semibold'
                    : 'text-ink-2 hover:bg-black/[0.04]'
                  }`}
              >
                <FlagIcon code={l.code} />
                <span>{l.label}</span>
                {l.code === lang && (
                  <svg className="ml-auto text-navy" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavLink({ to, children }) {
  const isHash = to.startsWith('/#')
  if (isHash) {
    return (
      <a href={to}
        className="text-[0.82rem] font-medium text-muted px-3.5 py-2 rounded-full hover:text-ink hover:bg-black/[0.04] transition-all duration-200">
        {children}
      </a>
    )
  }
  return (
    <Link to={to}
      className="text-[0.82rem] font-medium text-muted px-3.5 py-2 rounded-full hover:text-ink hover:bg-black/[0.04] transition-all duration-200">
      {children}
    </Link>
  )
}

function ScrollProgress() {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setWidth(max > 0 ? (window.scrollY / max) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent">
      <div className="h-full bg-gradient-to-r from-gold to-gold-light transition-[width] duration-100" style={{ width: `${width}%` }} />
    </div>
  )
}
