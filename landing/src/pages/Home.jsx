import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  LayoutTemplate, Bot, Clock,
  Search, PenLine, ShieldCheck,
  Zap, Target, BarChart2, Plug, Shield, TrendingUp,
  CheckCircle2, XCircle,
} from 'lucide-react'
import {
  Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost,
  Card, fadeUp, fadeUpBlur, fadeLeft, fadeRight,
  staggerContainer, staggerItem,
  OpenerCard, CompareTable, SocialProofCard,
} from '../components/ui'
import { useTranslation } from '../context/LanguageContext'
import ServiceFacts from '../components/ServiceFacts'
import PageH1 from '../components/PageH1'
import { getPageH1 } from '../lib/page-headings'
import { getExamples, getOpenerCards } from '../i18n/examples-data'

// ── OPENER CYCLE DATA ─────────────────────────────────────────────────────────
const CYCLE_OPENERS = [
  {
    quote: "Your breakdown of why cold email collapsed between 2023 and 2025 is the most precise articulation I've seen published. GPT filler is exactly the right framing.",
    role: 'Founder, Outbound Consultancy',
    signal: 'Signal: LinkedIn article, Q3 2024',
    qa: 5,
  },
  {
    quote: "Saw your team moved to a single AE pod model last quarter — that shift around reducing ramp time is exactly the context I'd want to unpack with you.",
    role: 'VP Sales, B2B SaaS (50 people)',
    signal: 'Signal: LinkedIn company hire, Jan 2025',
    qa: 5,
  },
  {
    quote: "Your podcast take on why most SDRs fail within 90 days because of ICP drift — not effort — is the most accurate framing I've heard from someone actually running the numbers.",
    role: 'Head of Revenue, RevOps Consultancy',
    signal: 'Signal: Podcast appearance, Feb 2025',
    qa: 4,
  },
]

// ── ICON BOX ──────────────────────────────────────────────────────────────────
function IconBox({ Icon, dark }) {
  return dark ? (
    <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.06] flex items-center justify-center mb-4 flex-shrink-0">
      <Icon className="w-5 h-5 text-gold" />
    </div>
  ) : (
    <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4 flex-shrink-0">
      <Icon className="w-5 h-5 text-navy" />
    </div>
  )
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const { t, lang } = useTranslation()
  const hookRef = useRef(null)
  const hookText = t('hero.hook')
  const seoH1 = getPageH1('/', lang)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Word mask entrance animation
  useEffect(() => {
    const el = hookRef.current
    if (!el) return
    const words = hookText.trim().split(/\s+/)
    el.innerHTML = ''
    words.forEach((word, i) => {
      if (i > 0) el.appendChild(document.createTextNode(' '))
      const wrap  = document.createElement('span')
      const inner = document.createElement('span')
      wrap.className  = 'word-mask'
      inner.className = 'word-inner'
      inner.textContent = word
      inner.style.transitionDelay = `${i * 60 + 200}ms`
      wrap.appendChild(inner)
      el.appendChild(wrap)
    })
    const timer = setTimeout(() => {
      el.querySelectorAll('.word-inner').forEach(w => w.classList.add('up'))
    }, 80)
    return () => clearTimeout(timer)
  }, [hookText])

  // Cycle opener examples
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % CYCLE_OPENERS.length)
        setIsVisible(true)
      }, 320)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const opener = CYCLE_OPENERS[activeIdx]

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-radial from-gold/[0.07] to-transparent" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-navy/[0.05] to-transparent" />
        <div className="absolute inset-0 grain-overlay opacity-[0.028]" />
        {/* Subtle grid */}
        <div className="absolute inset-0"
          style={{backgroundImage:'linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: headline + CTAs */}
          <motion.div {...fadeUp}>
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold mb-6">
              <span className="w-5 h-px bg-gold" />
              {t('hero.eyebrow')}
            </p>

            <PageH1 className="sr-only">{seoH1}</PageH1>

            <h2
              ref={hookRef}
              className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ink mb-6"
            >
              {hookText}
            </h2>

            <motion.p {...fadeUp} transition={{ delay: 0.15, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="text-lg sm:text-xl text-muted leading-relaxed mb-4">
              {t('hero.subtitle')}{' '}
              <span className="font-display italic font-semibold text-ink">{t('hero.italic')}</span>
            </motion.p>

            <motion.div {...fadeUp} transition={{ delay: 0.3, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-2 text-[0.82rem] font-medium text-ink-2 mb-10">
              <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot" />
              {t('hero.stat')}
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.42, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="flex flex-wrap items-center gap-3 mb-5">
              <BtnPrimary to="/free-lines" large>{t('hero.cta1')}</BtnPrimary>
              <BtnGhost to="/book-call">{t('hero.cta2')}</BtnGhost>
            </motion.div>

            <motion.p {...fadeUp} transition={{ delay: 0.52, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="text-xs text-muted-2 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 4v3l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {t('hero.disclaimer')}
            </motion.p>
          </motion.div>

          {/* Right: cycling opener preview */}
          <motion.div {...fadeUpBlur} transition={{ delay: 0.28, duration: 0.85, ease:[0.32,0.72,0,1] }}
            className="relative mt-10 lg:mt-0">
            <div className="relative pt-4 sm:pt-6 pb-10 sm:pb-12">

              {/* Preview card */}
              <div className="bg-white border border-border rounded-xl3 shadow-card relative overflow-hidden"
                style={{boxShadow:'0 8px 48px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'}}>

                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-gold via-gold/50 to-transparent" />

                {/* Header bar */}
                <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-border flex items-center justify-between">
                  <p className="text-[0.65rem] sm:text-[0.68rem] font-bold uppercase tracking-[0.12em] text-emerald-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {t('hero.preview.label')}
                  </p>
                  <div className="flex gap-1 items-center" aria-label="QA score: 5 of 5">
                    {[1,2,3,4,5].map(d => (
                      <span key={d} className={`w-[5px] h-[5px] rounded-full transition-colors duration-300 ${d <= opener.qa ? 'bg-gold' : 'bg-border-2'}`} />
                    ))}
                  </div>
                </div>

                {/* Cycling content */}
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="px-5 sm:px-6 py-5 min-h-[120px]"
                  style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(6px)', transition:'opacity 0.32s ease, transform 0.32s ease' }}>
                  <p className="font-display italic text-[clamp(0.9rem,2.5vw,1rem)] leading-relaxed text-ink">
                    &ldquo;{opener.quote}&rdquo;
                  </p>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  style={{ opacity: isVisible ? 1 : 0, transition:'opacity 0.32s ease' }}>
                  <div className="min-w-0">
                    <p className="text-[0.78rem] font-semibold text-ink-2">{opener.role}</p>
                    <p className="text-[0.72rem] text-muted italic mt-0.5">{opener.signal}</p>
                  </div>
                </div>

                {/* Cycle indicators */}
                <div className="px-5 sm:px-6 pb-4 flex items-center gap-1.5">
                  {CYCLE_OPENERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setIsVisible(false); setTimeout(() => { setActiveIdx(i); setIsVisible(true) }, 200) }}
                      className={`rounded-full transition-all duration-300 ${i === activeIdx ? 'w-4 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-border-2 hover:bg-gold/50'}`}
                      aria-label={`Show opener example ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="badge-float absolute -top-2 right-3 sm:right-6 bg-navy text-white text-[0.65rem] sm:text-[0.72rem] font-semibold px-3 sm:px-3.5 py-1.5 rounded-full shadow-cta flex items-center gap-2 max-w-[calc(100%-1.5rem)]">
                <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot flex-shrink-0" />
                <span className="truncate">{t('hero.preview.badge')}</span>
              </div>

              {/* Stats chip */}
              <div className="absolute -bottom-4 left-3 sm:left-8 bg-white border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-card flex items-center gap-2 sm:gap-3 max-w-[calc(100%-1.5rem)]">
                <div className="font-display text-xl sm:text-2xl font-bold text-navy flex-shrink-0">9.6%</div>
                <p className="text-[0.68rem] sm:text-[0.72rem] text-muted leading-tight">{t('hero.preview.stat')}</p>
              </div>
            </div>
          </motion.div>

        </div>
      </Container>
    </section>
  )
}

// ── INTEGRATOR STRIP (MARQUEE) ────────────────────────────────────────────────
const INTEGRATOR_TOOLS = ['Smartlead', 'Instantly', 'Lemlist', 'EmailBison', 'Clay', 'Apollo', 'HubSpot', 'Salesloft', 'Outreach']

function IntegratorStrip() {
  const doubled = [...INTEGRATOR_TOOLS, ...INTEGRATOR_TOOLS]
  return (
    <div className="border-y border-border py-4 bg-white/60">
      <Container>
        <div className="flex items-center gap-5 sm:gap-8">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-2 whitespace-nowrap flex-shrink-0">
            CSV-ready for
          </span>
          <div className="marquee-track flex-1">
            <div className="marquee-inner gap-2">
              {doubled.map((tool, i) => (
                <span key={i}
                  className="text-[0.76rem] font-medium text-ink-2 bg-white border border-border px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap mx-1 hover:border-gold/40 hover:text-ink transition-all duration-200">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

// ── PROBLEM ───────────────────────────────────────────────────────────────────
function Problem() {
  const { t } = useTranslation()
  const cards = [
    { Icon: LayoutTemplate, title: t('problem.c1.title'), body: t('problem.c1.body') },
    { Icon: Bot,            title: t('problem.c2.title'), body: t('problem.c2.body') },
    { Icon: Clock,          title: t('problem.c3.title'), body: t('problem.c3.body') },
  ]
  const stats = [
    { label: t('problem.stat1.label'), val:'2.1%' },
    { label: t('problem.stat2.label'), val:'9.6%' },
    { label: t('problem.stat3.label'), val:'4,200' },
  ]
  return (
    <Section className="bg-navy-dark text-white overflow-hidden" id="problem">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-gradient-radial from-navy/80 to-transparent opacity-70" />
        <div className="absolute inset-0"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)',backgroundSize:'72px 72px'}} />
      </div>
      <Container className="relative z-10">
        <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
          <Eyebrow light>{t('problem.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-white">
            {t('problem.title1')} <em className="italic text-gold">{t('problem.titleEm')}</em> {t('problem.title2')}
          </h2>
          <p className="mt-4 text-white/50 text-lg leading-relaxed">{t('problem.sub')}</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once:true, margin:'-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div key={i} variants={staggerItem} className="h-full">
              <Card dark className="h-full">
                <IconBox Icon={c.Icon} dark />
                <h3 className="font-display text-lg font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{c.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div {...fadeUp} transition={{delay:0.3}} className="mt-14 text-center">
          <div className="inline-grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04]">
            {stats.map((s, i) => (
              <div key={s.val}
                className={`px-8 py-5 text-center bg-white/[0.03] hover:bg-white/[0.06] transition-colors duration-200
                  ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-white/[0.07]' : ''}`}>
                <div className="font-display text-[clamp(1.5rem,4vw,2rem)] font-bold text-gold">{s.val}</div>
                <div className="text-[0.7rem] text-white/40 mt-1.5 max-w-[140px] mx-auto leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── AGITATION ─────────────────────────────────────────────────────────────────
function Agitation() {
  const { t } = useTranslation()
  const painPoints = [
    'Reps spend 3 hours/day on research that produces a one-line template',
    'AI openers signal "generated" before the prospect finishes the first sentence',
    'Domains warm while reply rates stay stuck at 2%',
  ]
  const stats = [
    { stat:'68%',   label: t('agitation.s1.label') },
    { stat:'3 sec', label: t('agitation.s2.label') },
    { stat:'$0',    label: t('agitation.s3.label') },
    { stat:'2 wks', label: t('agitation.s4.label') },
  ]
  return (
    <Section className="bg-cream-2">
      <ContainerSm className="text-center">
        <motion.div {...fadeUp}>
          <Eyebrow>{t('agitation.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
            {t('agitation.title1')} <em className="italic text-gold">{t('agitation.titleEm')}</em>
          </h2>
          <p className="mt-5 text-muted text-lg leading-relaxed max-w-xl mx-auto">{t('agitation.sub')}</p>
        </motion.div>

        {/* Pain point list */}
        <motion.ul {...fadeUp} transition={{delay:0.12}} className="mt-10 flex flex-col items-center gap-2.5 text-left">
          {painPoints.map((p, i) => (
            <li key={i} className="flex items-start gap-3 max-w-md">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted leading-relaxed">{p}</span>
            </li>
          ))}
        </motion.ul>

        {/* Stat grid */}
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
          className="flex flex-col sm:flex-row mt-12 rounded-2xl overflow-hidden border border-border bg-white divide-y sm:divide-y-0 sm:divide-x divide-border shadow-[0_2px_24px_rgba(0,0,0,0.04)]">
          {stats.map((s, i) => (
            <motion.div key={i} variants={staggerItem}
              className="flex-1 p-6 sm:p-8 text-center hover:bg-cream/60 transition-colors duration-200 group">
              <div className="font-display text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-navy mb-2 group-hover:scale-105 transition-transform duration-200">{s.stat}</div>
              <p className="text-[0.72rem] sm:text-[0.76rem] text-muted leading-snug">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </ContainerSm>
    </Section>
  )
}

// ── SOLUTION ──────────────────────────────────────────────────────────────────
function Solution() {
  const { t } = useTranslation()
  const features = [
    { Icon: Search,      title: t('solution.f1.title'), body: t('solution.f1.body') },
    { Icon: PenLine,     title: t('solution.f2.title'), body: t('solution.f2.body') },
    { Icon: ShieldCheck, title: t('solution.f3.title'), body: t('solution.f3.body') },
  ]
  const poweredBy = ['Anthropic Claude', 'LinkedIn', 'Apollo.io', 'Apify']
  return (
    <Section id="solution">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeLeft}>
            <Eyebrow>{t('solution.eyebrow')}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight">
              {t('solution.title')} <em className="italic text-gold">{t('solution.titleEm')}</em>
            </h2>
            <p className="mt-5 text-muted text-lg leading-relaxed">{t('solution.sub')}</p>
            <div className="mt-8 flex flex-col gap-5">
              {features.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.Icon className="w-4 h-4 text-navy" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-muted mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Powered by */}
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-2">Powered by</span>
              {poweredBy.map(name => (
                <span key={name} className="text-[0.72rem] font-medium text-muted bg-black/[0.04] border border-black/[0.06] px-2.5 py-1 rounded-full">
                  {name}
                </span>
              ))}
            </div>

            <div className="flex gap-3 mt-10">
              <BtnPrimary to="/free-lines">{t('solution.cta1')}</BtnPrimary>
              <BtnGhost to="/book-call">{t('solution.cta2')}</BtnGhost>
            </div>
          </motion.div>

          {/* CSV mockup */}
          <motion.div {...fadeRight} transition={{ delay:0.15, duration:0.85, ease:[0.32,0.72,0,1] }}>
            <div className="bg-black/[0.025] border border-black/[0.05] p-1.5 rounded-xl4">
              <div className="bg-white rounded-[calc(2rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="bg-navy px-5 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    {[0,1,2].map(d => <div key={d} className="w-2.5 h-2.5 rounded-full bg-white/20" />)}
                  </div>
                  <span className="text-white/50 text-xs font-mono">dossier_batch_001.csv</span>
                  <span className="ml-auto text-[0.6rem] text-white/30 font-medium">3 prospects · QA passed</span>
                </div>
                <div className="grid grid-cols-12 border-b border-border bg-cream px-4 py-2">
                  {['Prospect','Signal','Opener A','QA','Conf'].map((h, i) => (
                    <span key={h} className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-2"
                      style={{gridColumn: ['span 2','span 3','span 4','span 1','span 2'][i]}}>
                      {h}
                    </span>
                  ))}
                </div>
                {[
                  { name:'J. Whitmore', co:'LeadFlow', opener:'Your breakdown of why cold email collapsed 2023–25 is the most precise articulation I\'ve seen...', qa:4, conf:'High' },
                  { name:'M. Okafor', co:'Apex Outbound', opener:'Saw you launched in February and positioned around removing friction that every other tool buries in 5-step workflows...', qa:5, conf:'High' },
                  { name:'R. Castillo', co:'Clearpath B2B', opener:'Your thread on why SDR-to-AE handoffs break under 50 people is something I\'ve seen play out at 3 agencies...', qa:3, conf:'Med' },
                ].map((row, i) => (
                  <div key={i} className={`px-4 py-3 border-b border-border last:border-0 ${i%2===1?'bg-cream/60':''}`}>
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-20">
                        <p className="text-[0.75rem] font-semibold text-ink">{row.name}</p>
                        <p className="text-[0.65rem] text-muted">{row.co}</p>
                      </div>
                      <p className="text-[0.72rem] text-ink leading-relaxed flex-1 italic">{row.opener}</p>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <div className="flex gap-0.5" aria-label={`QA score ${row.qa} out of 5`}>
                          {[1,2,3,4,5].map(d=><span key={d} className={`w-1.5 h-1.5 rounded-full ${d<=row.qa?'bg-gold':'bg-border-2'}`}/>)}
                        </div>
                        <span className={`text-[0.62rem] font-bold px-1.5 py-0.5 rounded-full ${row.conf==='High'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{row.conf}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  )
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    {
      n: '01',
      title: t('hiw.s1.title'),
      body: t('hiw.s1.body'),
      time: '~5 min your time',
      icon: '📋',
    },
    {
      n: '02',
      title: t('hiw.s2.title'),
      body: t('hiw.s2.body'),
      time: '24–48 hours pipeline',
      icon: '🔬',
    },
    {
      n: '03',
      title: t('hiw.s3.title'),
      body: t('hiw.s3.body'),
      time: 'Instant import',
      icon: '🚀',
    },
  ]
  return (
    <Section className="bg-cream-2" id="how-it-works">
      <Container>
        <motion.div {...fadeUp} className="text-center mb-14">
          <Eyebrow>{t('hiw.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('hiw.title1')} <em className="italic text-gold">{t('hiw.titleEm')}</em>
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Connector line */}
          <div className="absolute hidden md:block top-[2.7rem] left-[calc(16.67%+0.5rem)] right-[calc(16.67%+0.5rem)] h-px bg-gradient-to-r from-gold/40 via-gold to-gold/40" aria-hidden="true" />

          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin:'-60px' }}
              transition={{ delay: i * 0.13, duration: 0.65, ease: [0.32,0.72,0,1] }}
              className="h-full">
              <Card hover className="h-full">
                {/* Step number with glow ring */}
                <div className="w-11 h-11 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center mb-5 shadow-cta relative z-10 glow-ring cursor-default" aria-hidden="true">
                  {s.n}
                </div>

                <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed mb-5">{s.body}</p>

                {/* Timing chip */}
                <div className="mt-auto inline-flex items-center gap-1.5 bg-gold/[0.08] border border-gold/20 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="w-3 h-3 text-gold flex-shrink-0" />
                  <span className="text-[0.68rem] font-semibold text-ink-2">{s.time}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp} transition={{delay:0.4}} className="text-center mt-12">
          <BtnPrimary to="/free-lines" large>{t('hiw.cta')}</BtnPrimary>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── EXAMPLE BLOCK ─────────────────────────────────────────────────────────────
function ExampleBlock({ ex, index }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.32, 0.72, 0, 1] }}
      className="bg-black/[0.022] border border-black/[0.055] p-[5px] rounded-[1.6rem] overflow-hidden"
    >
      <div className="bg-white rounded-[calc(1.6rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">

        {/* Signal bar */}
        <div className="px-5 py-3.5 border-b border-border/60 bg-cream/50 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-[5px] h-[5px] rounded-full bg-gold flex-shrink-0" aria-hidden="true" />
            <span className="text-[0.61rem] font-bold uppercase tracking-[0.14em] text-gold whitespace-nowrap">{ex.signalType}</span>
            <span className="text-[0.61rem] text-muted whitespace-nowrap">{ex.signalMeta}</span>
          </div>
          <span className="hidden sm:block text-[0.66rem] text-muted italic leading-snug ml-auto max-w-sm text-right line-clamp-1">{ex.signalSummary}</span>
        </div>

        {/* Before / After */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5 sm:p-7 border-b sm:border-b-0 sm:border-r border-border/60">
            <p className="text-[0.59rem] font-bold uppercase tracking-[0.15em] text-red-500 flex items-center gap-1.5 mb-4">
              <span className="w-[5px] h-[5px] rounded-full bg-red-400 flex-shrink-0" aria-hidden="true" />
              {t('examples.genericLabel')}
            </p>
            <p className="font-display italic text-[0.87rem] sm:text-[0.91rem] leading-relaxed text-ink/50">
              {ex.before}
            </p>
            <p className="text-[0.63rem] text-muted-2 mt-4 leading-snug">
              {t('examples.genericHelper')}
            </p>
          </div>

          <div className="relative p-5 sm:p-7 bg-cream/25 group hover:bg-cream/45 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-gold/70 via-gold/30 to-transparent" aria-hidden="true" />
            <p className="text-[0.59rem] font-bold uppercase tracking-[0.15em] text-emerald-600 flex items-center gap-1.5 mb-4">
              <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
              {t('examples.dossierLabel')}
            </p>
            <p className="font-display italic text-[0.87rem] sm:text-[0.91rem] leading-relaxed text-ink">
              {ex.after}
            </p>
            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/50">
              <span className="text-[0.63rem] text-muted">{ex.role}</span>
              <div className="flex gap-[3px]" aria-label={`QA score: ${ex.qa} out of 5`}>
                {[1, 2, 3, 4, 5].map(d => (
                  <span key={d} className={`w-[5px] h-[5px] rounded-full ${d <= ex.qa ? 'bg-gold' : 'bg-black/10'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why it works */}
        <div className="px-5 sm:px-7 py-4 border-t border-border/50 bg-navy/[0.025] flex items-start gap-3">
          <svg className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-[1px]" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.8" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7 6.5V9.5M7 4.5V5.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="text-[0.75rem] text-muted leading-relaxed">
            <strong className="text-ink font-semibold">{t('examples.whyPrefix')}</strong>
            {ex.why}
          </p>
        </div>

      </div>
    </motion.div>
  )
}

// ── EXAMPLES ──────────────────────────────────────────────────────────────────
function Examples() {
  const { t, lang } = useTranslation()
  const examples = getExamples(lang)
  const openers = getOpenerCards(lang)
  return (
    <Section id="examples">
      <Container>
        <motion.div {...fadeUp} className="text-center mb-12">
          <Eyebrow>{t('examples.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('examples.title')} <em className="italic text-gold">{t('examples.titleEm')}</em>
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto">{t('examples.sub')}</p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {examples.map((ex, i) => <ExampleBlock key={ex.id} ex={ex} index={i} />)}
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mt-16">
          <Eyebrow>{t('examples.openers.eyebrow')}</Eyebrow>
          <motion.div
            variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5"
          >
            {openers.map((o, i) => <OpenerCard key={i} {...o} />)}
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-12 text-center">
          <p className="text-sm text-muted mb-5">{t('examples.ctaNote')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <BtnPrimary to="/free-lines" large>{t('examples.cta1')}</BtnPrimary>
            <BtnGhost to="/book-call">{t('examples.cta2')}</BtnGhost>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── WHY US ────────────────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { label: 'Research signals / lead', dossier: '5+ live signals',  ai: 'Name + title',  manual: '1–2 signals' },
  { label: 'QA scoring pass',         dossier: true,               ai: false,            manual: 'Manual check' },
  { label: 'Delivery speed',          dossier: '24–48 hours',      ai: 'Instant',        manual: '3–5 days' },
  { label: 'Cost per prospect',       dossier: '~$1–2.50',         ai: '~$0',            manual: '~$25–35' },
  { label: 'Scales to 500+ leads',    dossier: true,               ai: true,             manual: false },
  { label: 'Sequencer-ready CSV',     dossier: true,               ai: 'Manual copy',    manual: 'Manual copy' },
]

function WhyUs() {
  const { t } = useTranslation()
  const features = [
    { title: t('whyus.f1.title'), body: t('whyus.f1.body') },
    { title: t('whyus.f2.title'), body: t('whyus.f2.body') },
    { title: t('whyus.f3.title'), body: t('whyus.f3.body') },
  ]
  return (
    <Section className="bg-navy-dark text-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div {...fadeLeft}>
            <Eyebrow light>{t('whyus.eyebrow')}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-white">
              {t('whyus.title1')} <em className="italic text-gold">{t('whyus.titleEm')}</em>
            </h2>
            <p className="mt-5 text-white/50 text-lg leading-relaxed">{t('whyus.sub')}</p>
            <div className="mt-8 flex flex-col gap-5">
              {features.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="#B8975A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-white/45 mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Comparison table */}
          <motion.div {...fadeRight} transition={{delay:0.18}}>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/30 mb-3">How we compare</p>
            <CompareTable rows={COMPARE_ROWS} />
            <p className="text-[0.7rem] text-white/25 mt-3">
              * Cost per prospect based on typical BDR time allocation at $60k/yr salary.
            </p>
          </motion.div>
        </div>
      </Container>
    </Section>
  )
}

// ── SOCIAL PROOF ──────────────────────────────────────────────────────────────
const PROOF_CARDS = [
  {
    quote: "We booked 11 meetings from the first 80-prospect batch. More pipeline than our entire manual research quarter.",
    role: 'Founder, B2B Outbound Agency',
    result: '11 meetings from 80 prospects',
  },
  {
    quote: "The QA scoring is what sold us. We stopped wondering which openers were good — the score told us. Bad ones never shipped.",
    role: 'Head of Sales Development, SaaS Startup',
    result: '9.4% reply rate on pilot batch',
  },
  {
    quote: "Our senior BDR went from 3 hours of daily research to 20 minutes reviewing output. She's now running twice the volume.",
    role: 'RevOps Lead, Staffing Tech Company',
    result: '2× prospect volume, same team size',
  },
]

function SocialProof() {
  return (
    <Section>
      <Container>
        <motion.div {...fadeUp} className="text-center mb-12">
          <Eyebrow>Early results</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            What teams tell us after the <em className="italic text-gold">first batch.</em>
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto">
            Pilot-stage results across outbound agencies, SaaS founders, and RevOps teams.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
          className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROOF_CARDS.map((card, i) => (
            <SocialProofCard key={i} {...card} index={i} />
          ))}
        </motion.div>

        {/* Aggregate proof bar */}
        <motion.div {...fadeUp} transition={{delay:0.3}} className="mt-10">
          <div className="bg-cream-2 border border-border rounded-2xl px-6 py-5 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { val: '9.6%', label: 'avg reply rate, Dossier openers' },
              { val: '3.1×', label: 'improvement vs. baseline' },
              { val: '4,200', label: 'emails tracked in pilot cohort' },
              { val: '48h', label: 'max turnaround, 100-prospect batch' },
            ].map(s => (
              <div key={s.val} className="text-center">
                <div className="font-display text-[clamp(1.25rem,3vw,1.6rem)] font-bold text-navy">{s.val}</div>
                <div className="text-[0.68rem] text-muted mt-0.5 max-w-[120px] leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── CREDIBILITY ───────────────────────────────────────────────────────────────
function Credibility() {
  const { t } = useTranslation()
  const stats = [
    { val:'3.1%',  label: t('cred.s1.label') },
    { val:'9.6%',  label: t('cred.s2.label') },
    { val:'4,200', label: t('cred.s3.label') },
    { val:'48h',   label: t('cred.s4.label') },
  ]
  return (
    <Section className="bg-cream-2">
      <Container>
        <motion.div {...fadeUp} className="text-center mb-12">
          <Eyebrow>{t('cred.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('cred.title')} <em className="italic text-gold">{t('cred.titleEm')}</em>
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto">{t('cred.sub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="lg:col-span-3 grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} variants={staggerItem}
                className="bg-white border border-border rounded-xl2 p-6 text-center hover:shadow-card hover:-translate-y-[5px] transition-all duration-300 shine-card group relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                <div className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-navy mb-2 group-hover:scale-105 transition-transform duration-200">{s.val}</div>
                <p className="text-xs text-muted leading-snug">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeRight} transition={{delay:0.2}} className="lg:col-span-2">
            <div className="bg-white border border-border border-l-4 border-l-gold rounded-xl p-6 text-sm text-muted leading-relaxed">
              <strong className="text-ink font-semibold block mb-2">{t('cred.note.bold')}</strong>
              {t('cred.note.body')}
            </div>

            {/* Methodology badge */}
            <div className="mt-4 bg-navy/[0.04] border border-navy/[0.08] rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-[0.76rem] font-semibold text-ink">Documented methodology</p>
                <p className="text-[0.72rem] text-muted mt-0.5 leading-snug">
                  Same sequencer, same list, same offer — only the opener changed. Results tracked across 3 separate client campaigns over 6 weeks.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  )
}

// ── BENEFITS ──────────────────────────────────────────────────────────────────
function Benefits() {
  const { t } = useTranslation()
  const benefits = [
    { Icon: Zap,        title: t('benefits.b1.title'), body: t('benefits.b1.body'), accent: true },
    { Icon: Target,     title: t('benefits.b2.title'), body: t('benefits.b2.body') },
    { Icon: BarChart2,  title: t('benefits.b3.title'), body: t('benefits.b3.body') },
    { Icon: Plug,       title: t('benefits.b4.title'), body: t('benefits.b4.body'), accent: true },
    { Icon: Shield,     title: t('benefits.b5.title'), body: t('benefits.b5.body') },
    { Icon: TrendingUp, title: t('benefits.b6.title'), body: t('benefits.b6.body') },
  ]
  // Bento spans: [wide, narrow, narrow, wide, narrow, wide] gives an asymmetric, interesting grid
  const spans = [
    'sm:col-span-2',
    'sm:col-span-1',
    'sm:col-span-1',
    'sm:col-span-2',
    'sm:col-span-1',
    'sm:col-span-2',
  ]
  return (
    <Section>
      <Container>
        <motion.div {...fadeUp} className="text-center mb-14">
          <Eyebrow>{t('benefits.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('benefits.title')} <em className="italic text-gold">{t('benefits.titleEm')}</em>
          </h2>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {benefits.map((b, i) => (
            <motion.div key={i} variants={staggerItem} className={spans[i]}>
              <Card hover className="h-full shine-card">
                <IconBox Icon={b.Icon} />
                <h3 className={`font-semibold mb-1.5 ${b.accent ? 'text-navy' : 'text-ink'}`}>{b.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{b.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}

// ── PRICING PREVIEW ───────────────────────────────────────────────────────────
function PricingPreview() {
  const { t } = useTranslation()
  const plans = [
    {
      name: t('pricing.starter.name'), price:'$499', unit:'/mo',
      prospects: t('pricing.starter.prospects'), desc: t('pricing.starter.desc'),
      perProspect: '~$1.00 / prospect',
      features: [t('pricing.starter.f1'), t('pricing.starter.f2'), t('pricing.starter.f3'), t('pricing.starter.f4')],
      cta: t('pricing.cta.start'), ctaTo: '/free-lines', highlight: false,
    },
    {
      name: t('pricing.growth.name'), price:'$999', unit:'/mo',
      prospects: t('pricing.growth.prospects'), desc: t('pricing.growth.desc'),
      perProspect: '~$0.50 / prospect',
      features: [t('pricing.growth.f1'), t('pricing.growth.f2'), t('pricing.growth.f3'), t('pricing.growth.f4'), t('pricing.growth.f5')],
      cta: t('pricing.cta.start'), ctaTo: '/free-lines', highlight: true,
    },
    {
      name: t('pricing.agency.name'), price:'Custom', unit:'',
      prospects: t('pricing.agency.prospects'), desc: t('pricing.agency.desc'),
      perProspect: 'Volume discounts',
      features: [t('pricing.agency.f1'), t('pricing.agency.f2'), t('pricing.agency.f3'), t('pricing.agency.f4'), t('pricing.agency.f5')],
      cta: t('pricing.cta.call'), ctaTo: '/book-call', highlight: false,
    },
  ]
  return (
    <Section className="bg-cream-2">
      <Container>
        <motion.div {...fadeUp} className="text-center mb-14">
          <Eyebrow>{t('pricing.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('pricing.title')} <em className="italic text-gold">{t('pricing.titleEm')}</em>
          </h2>
          {/* Value anchor */}
          <p className="mt-3 text-sm text-muted max-w-sm mx-auto">
            A BDR researching manually costs ~$25–35 per prospect. Dossier delivers the same quality at 95% less.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
          className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div key={i} variants={staggerItem}
              className={`relative ${plan.highlight ? 'ring-2 ring-navy' : ''}`}
              style={{ borderRadius:'calc(1.5rem + 4px)' }}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-navy text-white text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1 rounded-full z-10">
                  {t('pricing.popular')}
                </div>
              )}
              <Card hover className="h-full">
                <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-ink">{plan.price}</span>
                  <span className="text-muted text-sm">{plan.unit}</span>
                </div>
                {/* Per-prospect anchoring */}
                <p className="text-[0.72rem] font-semibold text-gold mb-1">{plan.perProspect}</p>
                <p className="text-xs text-muted mb-3">{plan.prospects}</p>
                <p className="text-sm text-muted mb-5 leading-relaxed">{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg className="text-gold flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-ink-2">{f}</span>
                    </li>
                  ))}
                </ul>
                <BtnPrimary to={plan.ctaTo} className="w-full justify-center">{plan.cta}</BtnPrimary>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div {...fadeUp} className="text-center mt-8 space-y-2">
          <Link to="/pricing" className="text-sm font-semibold text-navy hover:underline">
            {t('pricing.link')}
          </Link>
          <p className="text-[0.72rem] text-muted-2">Free 100-line pilot included · No credit card required to start</p>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(null)
  const faqs = [
    { q: t('faq.q1.q'), a: t('faq.q1.a') },
    { q: t('faq.q2.q'), a: t('faq.q2.a') },
    { q: t('faq.q3.q'), a: t('faq.q3.a') },
    { q: t('faq.q4.q'), a: t('faq.q4.a') },
    { q: t('faq.q5.q'), a: t('faq.q5.a') },
    { q: t('faq.q6.q'), a: t('faq.q6.a') },
  ]
  return (
    <Section id="faq" className="bg-cream-2">
      <ContainerSm>
        <motion.div {...fadeUp} className="text-center mb-10">
          <Eyebrow>{t('faq.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('faq.title')} <em className="italic text-gold">{t('faq.titleEm')}</em>
          </h2>
        </motion.div>
        <motion.div {...fadeUp} transition={{delay:0.1}}
          className="bg-white border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-[0_2px_24px_rgba(0,0,0,0.04)]">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i}>
                <button
                  id={`faq-btn-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors group"
                >
                  <span>{faq.q}</span>
                  <span className={`w-7 h-7 rounded-full border border-border-2 flex items-center justify-center flex-shrink-0 text-muted
                    transition-all duration-300 group-hover:border-navy/30 ${isOpen ? 'bg-navy text-white border-navy rotate-45' : ''}`}
                    aria-hidden="true">
                    +
                  </span>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                  className={`faq-body ${isOpen ? 'open' : ''}`}
                >
                  <div><p className="px-6 pb-5 text-sm text-muted leading-relaxed pr-10">{faq.a}</p></div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </ContainerSm>
    </Section>
  )
}

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  const { t } = useTranslation()
  const proofPoints = [
    'No credit card required',
    '100 openers delivered in 48 hours',
    'Results reviewed together',
  ]
  return (
    <Section className="bg-navy-dark">
      <Container>
        <motion.div {...fadeUp}
          className="relative bg-white/[0.04] border border-white/[0.07] rounded-xl4 p-10 md:p-16 text-center overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold/[0.09] to-transparent" />
            <div className="absolute -top-24 left-1/3 w-64 h-64 rounded-full bg-gradient-radial from-navy/60 to-transparent" />
          </div>

          <div className="relative z-10">
            {/* Urgency signal */}
            <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 rounded-full px-4 py-2 text-[0.78rem] font-semibold text-gold mb-6">
              <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot" />
              Currently accepting pilot applications
            </div>

            <Eyebrow light>{t('finalcta.eyebrow')}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-white mb-4">
              {t('finalcta.title1')} <em className="italic text-gold">{t('finalcta.titleEm')}</em>
            </h2>
            <p className="text-white/50 text-lg max-w-md mx-auto mb-10">{t('finalcta.sub')}</p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <BtnPrimary to="/free-lines" large>{t('finalcta.cta1')}</BtnPrimary>
              <BtnGhost to="/book-call" light>{t('finalcta.cta2')}</BtnGhost>
            </div>

            {/* Micro proof points */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {proofPoints.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-white/35 text-xs">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── SEO SECTIONS ──────────────────────────────────────────────────────────────
function HomeSeoIntro() {
  const { t } = useTranslation()
  return (
    <Section>
      <ContainerSm>
        <motion.article {...fadeUp} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-ink mb-5">
            {t('seoIntro.title')}
          </h2>
          <p className="text-muted leading-relaxed mb-4">{t('seoIntro.p1')}</p>
          <p className="text-muted leading-relaxed mb-4">{t('seoIntro.p2')}</p>
          <blockquote className="border-l-2 border-gold pl-4 text-left text-ink-2 text-sm leading-relaxed italic">
            {t('seoIntro.quote')}
          </blockquote>
        </motion.article>
      </ContainerSm>
    </Section>
  )
}

function HomeQueryAnswers() {
  const { t } = useTranslation()
  const items = [
    { title: t('query.what.title'), body: t('query.what.body') },
    { title: t('query.how.title'), body: t('query.how.body') },
    { title: t('query.why.title'), body: t('query.why.body') },
  ]
  return (
    <Section>
      <ContainerSm>
        <motion.article {...fadeUp} className="max-w-3xl mx-auto space-y-8">
          {items.map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-[clamp(1.35rem,2.8vw,1.75rem)] font-bold text-ink mb-3">
                {item.title}
              </h2>
              <p className="text-muted leading-relaxed">{item.body}</p>
            </div>
          ))}
        </motion.article>
      </ContainerSm>
    </Section>
  )
}

function HomeTopThreeReasons() {
  const { t } = useTranslation()
  const items = [
    { title: t('top3.s1.title'), body: t('top3.s1.body') },
    { title: t('top3.s2.title'), body: t('top3.s2.body') },
    { title: t('top3.s3.title'), body: t('top3.s3.body') },
  ]
  return (
    <Section>
      <ContainerSm>
        <motion.article {...fadeUp} className="max-w-3xl mx-auto">
          <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-ink mb-6 text-center">
            {t('top3.title')}
          </h2>
          <ol className="space-y-5 list-decimal pl-5 marker:font-semibold marker:text-navy">
            {items.map((item) => (
              <li key={item.title} className="pl-1">
                <h3 className="font-display text-lg font-semibold text-ink mb-1">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </motion.article>
      </ContainerSm>
    </Section>
  )
}

function HomeTopFiveSignals() {
  const { t } = useTranslation()
  const items = [
    { title: t('top5.s1.title'), body: t('top5.s1.body') },
    { title: t('top5.s2.title'), body: t('top5.s2.body') },
    { title: t('top5.s3.title'), body: t('top5.s3.body') },
    { title: t('top5.s4.title'), body: t('top5.s4.body') },
    { title: t('top5.s5.title'), body: t('top5.s5.body') },
  ]
  return (
    <Section className="bg-cream-2">
      <ContainerSm>
        <motion.article {...fadeUp} className="max-w-3xl mx-auto">
          <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-ink mb-6 text-center">
            {t('top5.title')}
          </h2>
          <ol className="space-y-5 list-decimal pl-5 marker:font-semibold marker:text-navy">
            {items.map((item) => (
              <li key={item.title} className="pl-1">
                <h3 className="font-display text-lg font-semibold text-ink mb-1">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </motion.article>
      </ContainerSm>
    </Section>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <Hero />
      <IntegratorStrip />
      <Problem />
      <Agitation />
      <Solution />
      <HowItWorks />
      <Examples />
      <WhyUs />
      <SocialProof />
      <Credibility />
      <Benefits />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
      <HomeSeoIntro />
      <HomeQueryAnswers />
      <HomeTopThreeReasons />
      <HomeTopFiveSignals />
      <ServiceFacts titleKey="serviceFacts.title.home" className="bg-cream-2 py-12 sm:py-16" />
    </>
  )
}
