import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

// ── ANIMATION VARIANTS ──────────────────────────────────────────────────────
export const fadeUp = {
  initial:     { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 0.75, ease: [0.32,0.72,0,1] },
}

export const fadeUpBlur = {
  initial:     { opacity: 0, y: 28, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 0.8, ease: [0.32,0.72,0,1] },
}

export const fadeLeft = {
  initial:     { opacity: 0, x: -32 },
  whileInView: { opacity: 1, x: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 0.75, ease: [0.32,0.72,0,1] },
}

export const fadeRight = {
  initial:     { opacity: 0, x: 32 },
  whileInView: { opacity: 1, x: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 0.75, ease: [0.32,0.72,0,1] },
}

export const staggerContainer = {
  initial:     {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport:    { once: true, margin: '-60px' },
}

export const staggerItem = {
  initial:    { opacity: 0, y: 28, scale: 0.98 },
  whileInView:{ opacity: 1, y: 0,  scale: 1 },
  transition: { duration: 0.65, ease: [0.32,0.72,0,1] },
}

// ── SECTION WRAPPER ──────────────────────────────────────────────────────────
export function Section({ children, className = '', id }) {
  return (
    <section id={id} className={`relative py-16 sm:py-24 lg:py-32 ${className}`}>
      {children}
    </section>
  )
}

export function Container({ children, className = '' }) {
  return <div className={`max-w-6xl mx-auto px-5 sm:px-8 ${className}`}>{children}</div>
}

export function ContainerSm({ children, className = '' }) {
  return <div className={`max-w-3xl mx-auto px-5 sm:px-8 ${className}`}>{children}</div>
}

// ── EYEBROW BADGE ────────────────────────────────────────────────────────────
export function Eyebrow({ children, light }) {
  return (
    <p className={`inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] mb-4 ${light ? 'text-white/40' : 'text-muted'}`}>
      <span className="w-[5px] h-[5px] rounded-full bg-gold flex-shrink-0" />
      {children}
    </p>
  )
}

// ── PRIMARY CTA BUTTON ────────────────────────────────────────────────────────
export function BtnPrimary({ to, href, children, large, className = '' }) {
  const cls = `inline-flex items-center gap-3 bg-navy text-white font-semibold rounded-full shadow-cta
    hover:bg-navy-2 hover:shadow-cta-hover hover:scale-[1.025] active:scale-[0.97]
    transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group
    ${large ? 'text-[1rem] pl-6 pr-2 py-3' : 'text-[0.88rem] pl-5 pr-2 py-2.5'} ${className}`

  const icon = (
    <span className={`rounded-full bg-white/[0.14] flex items-center justify-center flex-shrink-0
      group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:bg-white/25
      transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
      ${large ? 'w-10 h-10' : 'w-8 h-8'}`}>
      <svg width={large?14:12} height={large?14:12} viewBox="0 0 14 14" fill="none">
        <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )

  if (to) return <Link to={to} className={cls}>{children}{icon}</Link>
  if (!href) return null
  const isExternal = href.startsWith('http')
  return (
    <a href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cls}>
      {children}{icon}
    </a>
  )
}

// ── GHOST BUTTON ──────────────────────────────────────────────────────────────
export function BtnGhost({ to, href, children, light, className = '' }) {
  const cls = `inline-flex items-center gap-2 font-medium text-[0.88rem] rounded-full border px-5 py-2.5
    transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]
    ${light
      ? 'border-white/20 text-white/70 hover:border-white/40 hover:text-white hover:bg-white/5'
      : 'border-border-2 text-ink hover:border-navy/40 hover:bg-navy/5'
    } ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (!href) return null
  const isExternal = href.startsWith('http')
  return (
    <a href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cls}>
      {children}
    </a>
  )
}

// ── CARD (DOUBLE BEZEL) ──────────────────────────────────────────────────────
export function Card({ children, className = '', innerClassName = '', hover = true, dark }) {
  const outer = dark
    ? 'bg-white/[0.04] border border-white/[0.07] p-[5px] rounded-xl3'
    : 'bg-black/[0.025] border border-black/[0.05] p-[5px] rounded-xl3'
  const inner = dark
    ? 'bg-white/[0.06] rounded-[calc(1.5rem-4px)] p-6 h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'bg-white rounded-[calc(1.5rem-4px)] p-6 h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
  return (
    <div className={`${outer} ${hover ? 'transition-all duration-300 hover:-translate-y-[5px] hover:shadow-card' : ''} ${className}`}>
      <div className={`${inner} ${innerClassName}`}>{children}</div>
    </div>
  )
}

// ── SECTION DIVIDER ───────────────────────────────────────────────────────────
export function Divider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-border-2 to-transparent" />
}

// ── STAT COUNTER DISPLAY ──────────────────────────────────────────────────────
export function StatBig({ value, label, suffix = '' }) {
  return (
    <div className="text-center">
      <div className="font-display text-[clamp(2rem,5vw,3rem)] font-bold text-navy leading-none mb-2">
        {value}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-muted font-medium leading-tight">{label}</div>
    </div>
  )
}

// ── OPENER EXAMPLE CARD ───────────────────────────────────────────────────────
export function OpenerCard({ quote, role, signal, qa = 4, delay = 0 }) {
  return (
    <motion.div
      variants={staggerItem}
      className="bg-white border border-border rounded-xl3 p-4 sm:p-6 relative overflow-hidden
        hover:-translate-y-1 hover:shadow-card transition-all duration-300 group"
    >
      <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-gold to-transparent" />
      <p className="font-display italic text-[clamp(0.9rem,2.2vw,1rem)] leading-relaxed text-ink mb-4">{quote}</p>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.78rem] font-semibold text-ink-2">{role}</p>
          <p className="text-[0.72rem] text-muted italic mt-0.5 break-words">{signal}</p>
        </div>
        <div className="flex gap-1 items-center flex-shrink-0 mt-0.5">
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`w-2 h-2 rounded-full ${i<=qa ? 'bg-gold' : 'bg-border-2'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── BEFORE / AFTER ROW ────────────────────────────────────────────────────────
export function BeforeAfterRow({ before, after, source }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 overflow-hidden rounded-xl3 border border-border">
      <div className="bg-white p-4 sm:p-6 sm:border-r border-border">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-red-600 flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Generic opener
        </p>
        <p className="font-display italic text-[clamp(0.88rem,2vw,0.97rem)] leading-relaxed text-ink-2">{before}</p>
        <p className="text-[0.72rem] text-muted mt-3">Applies to thousands of people. Gets deleted.</p>
      </div>
      <div className="bg-cream-2 p-4 sm:p-6 border-t sm:border-t-0 border-border">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-emerald-700 flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Dossier opener
        </p>
        <p className="font-display italic text-[clamp(0.88rem,2vw,0.97rem)] leading-relaxed text-ink">{after}</p>
        <p className="text-[0.72rem] text-muted mt-3 break-words">Signal: {source}</p>
      </div>
    </div>
  )
}

// ── COMPARISON TABLE ──────────────────────────────────────────────────────────
export function CompareTable({ rows }) {
  const cols = ['', 'Dossier', 'Generic AI', 'Manual BDR']
  return (
    <div className="w-full overflow-hidden rounded-xl2 border border-white/[0.1]">
      {/* Header */}
      <div className="grid grid-cols-4 text-[0.65rem] font-bold uppercase tracking-[0.12em]">
        <div className="col-span-1 py-3 px-4 bg-white/[0.04] text-white/30" />
        <div className="col-span-1 py-3 px-4 bg-gold/20 text-gold text-center border-l border-white/[0.08]">
          Dossier
        </div>
        <div className="col-span-1 py-3 px-4 bg-white/[0.04] text-white/35 text-center border-l border-white/[0.08]">
          Generic AI
        </div>
        <div className="col-span-1 py-3 px-4 bg-white/[0.04] text-white/35 text-center border-l border-white/[0.08]">
          Manual BDR
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-4 border-t border-white/[0.07] ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
          <div className="col-span-1 py-3 px-4 text-[0.76rem] text-white/55 font-medium flex items-center">{row.label}</div>
          <div className="col-span-1 py-3 px-4 border-l border-white/[0.08] flex items-center justify-center">
            <CellValue value={row.dossier} highlight />
          </div>
          <div className="col-span-1 py-3 px-4 border-l border-white/[0.08] flex items-center justify-center">
            <CellValue value={row.ai} />
          </div>
          <div className="col-span-1 py-3 px-4 border-l border-white/[0.08] flex items-center justify-center">
            <CellValue value={row.manual} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CellValue({ value, highlight }) {
  if (value === true)  return <span className={`text-sm font-bold ${highlight ? 'text-gold' : 'text-white/40'}`}>✓</span>
  if (value === false) return <span className="text-sm text-white/25">✗</span>
  return <span className={`text-[0.76rem] font-medium text-center leading-tight ${highlight ? 'text-white/90' : 'text-white/40'}`}>{value}</span>
}

// Avatar glyphs: visually distinct initials that don't derive from role text
const AVATAR_GLYPHS = ['AG', 'MO', 'RC']
const AVATAR_COLORS = [
  'bg-navy/[0.08] border-navy/[0.1] text-navy/60',
  'bg-gold/[0.12] border-gold/30 text-gold',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
]

// ── SOCIAL PROOF CARD ─────────────────────────────────────────────────────────
export function SocialProofCard({ quote, role, result, index = 0 }) {
  const glyph  = AVATAR_GLYPHS[index % AVATAR_GLYPHS.length]
  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <motion.div
      variants={staggerItem}
      className="bg-white border border-border rounded-xl3 p-6 sm:p-7 relative overflow-hidden
        hover:-translate-y-[5px] hover:shadow-card transition-all duration-300 shine-card group"
    >
      <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-gold/60 via-gold/20 to-transparent" />

      {/* Decorative quote mark */}
      <div className="absolute top-4 right-5 font-display text-[3rem] leading-none text-gold/10 select-none" aria-hidden="true">"</div>

      {/* Result metric chip */}
      {result && (
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-3 py-1 mb-5">
          <span className="w-[5px] h-[5px] rounded-full bg-gold flex-shrink-0" aria-hidden="true" />
          <span className="text-[0.7rem] font-bold text-ink-2">{result}</span>
        </div>
      )}

      <p className="font-display italic text-[clamp(0.9rem,2.2vw,1rem)] leading-relaxed text-ink mb-5 relative z-10">
        "{quote}"
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${colors}`}>
          <span className="text-[0.6rem] font-bold uppercase">{glyph}</span>
        </div>
        <p className="text-[0.76rem] font-medium text-ink-2 leading-snug">{role}</p>
      </div>
    </motion.div>
  )
}
