import { Link } from 'react-router-dom'

// Hash links must use plain <a href> — React Router's <Link> does not scroll to anchors reliably
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

const nav = {
  Product: [
    { l: 'How it works', to: '/#how-it-works' },
    { l: 'Examples',     to: '/#examples' },
    { l: 'Pricing',      to: '/pricing' },
    { l: 'FAQ',          to: '/#faq' },
  ],
  Offers: [
    { l: '100 Free Lines',      to: '/free-lines' },
    { l: 'Book a 15-min Call',  to: '/book-call' },
  ],
  Company: [
    { l: 'About',   to: '/about' },
    { l: 'Contact', to: 'https://cal.com/getdossier/pilot' },
  ],
  Legal: [
    { l: 'Privacy Policy',   to: '/privacy',  newTab: true },
    { l: 'Terms of Service', to: '/terms',    newTab: true },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-cream-2">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-md bg-navy flex items-center justify-center flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
              </span>
              <span className="font-display font-semibold text-navy text-[1rem] tracking-tight">
                Dossier
              </span>
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Research-backed personalized openers for outbound agencies and B2B founders who refuse to send the same line to everyone.
            </p>
            <div className="mt-6">
              <a
                href="https://cal.com/getdossier/pilot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-cta hover:bg-navy-2 transition-all duration-200"
              >
                Book a free 15-min call
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
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

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-2">© {new Date().getFullYear()} Dossier. All rights reserved.</p>
          <p className="text-xs text-muted-2">
            Questions?{' '}
            <a href="https://cal.com/getdossier/pilot" target="_blank" rel="noopener noreferrer"
              className="text-navy hover:underline">
              Book a call →
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
