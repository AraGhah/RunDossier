import { Link } from 'react-router-dom'
import ContactBlock from './ContactBlock'
import { useTranslation } from '../context/LanguageContext'

// Hash links must use plain <a href>, React Router's <Link> does not scroll to anchors reliably
function FooterLink({ to, children, newTab }) {
  const isHash = to.includes('#')
  const isExternal = to.startsWith('http')
  const cls = "text-sm text-muted hover:text-navy transition-colors duration-200"
  if (isHash || isExternal || newTab) {
    return (
      <a href={to} className={cls}
        {...(newTab || isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  }
  return <Link to={to} className={cls}>{children}</Link>
}

export default function Footer() {
  const { t } = useTranslation()
  const nav = {
    [t('footer.col.product')]: [
      { l: t('footer.link.hiw'), to: '/#how-it-works' },
      { l: t('footer.link.examples'), to: '/#examples' },
      { l: t('footer.link.pricing'), to: '/pricing' },
      { l: t('footer.link.faq'), to: '/#faq' }],
    [t('footer.col.offers')]: [
      { l: t('footer.link.service'), to: '/service' },
      { l: t('footer.link.freeLines'), to: '/free-lines' },
      { l: t('footer.link.bookCall'), to: '/book-call' }],
    [t('footer.col.company')]: [
      { l: t('footer.link.about'), to: '/about' },
      { l: t('footer.link.contact'), to: '/contact' }],
    [t('footer.col.legal')]: [
      { l: t('footer.link.privacy'), to: '/privacy', newTab: true },
      { l: t('footer.link.terms'), to: '/terms', newTab: true }],
  }

  return (
    <footer className="border-t border-border bg-cream-2">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4" onClick={() => window.scrollTo({ top: 0, left: 0 })}>
              <span className="w-7 h-7 rounded-md bg-navy flex items-center justify-center flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
              </span>
              <span className="font-display font-semibold text-navy text-[1rem] tracking-tight">
                Dossier
              </span>
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              {t('footer.brand')}
            </p>
            <div className="mt-5">
              <ContactBlock />
            </div>
            <div className="mt-5">
              <a
                href="https://www.linkedin.com/in/ara-ghahramanyan-086261405/"
                target="_blank"
                rel="noopener noreferrer me"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy underline underline-offset-[3px] decoration-navy/40 hover:decoration-navy transition-colors"
              >
                {t('footer.linkedin')}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
            <div className="mt-6">
              <Link
                to="/book-call"
                className="inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-5 py-3 rounded-full shadow-cta hover:bg-navy-2 transition-all duration-200"
              >
                {t('footer.cta')}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(nav).map(([title, items]) => (
            <div key={title}>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-2 mb-4">{title}</p>
              <ul className="flex flex-col gap-3">
                {items.map(({ l, to, newTab }) => (
                  <li key={l}>
                    <FooterLink to={to} newTab={newTab}>{l}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-2">© {new Date().getFullYear()} Dossier. {t('footer.rights')}</p>
          <p className="text-xs text-muted-2">
            <Link to="/book-call" className="text-navy hover:underline">
              {t('footer.schedule')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
