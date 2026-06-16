import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  LayoutTemplate, Bot, Clock,
  Search, PenLine, ShieldCheck,
  Zap, Target, BarChart2, Plug, Shield, TrendingUp,
} from 'lucide-react'
import {
  Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost,
  Card, Divider, fadeUp, fadeUpBlur, staggerContainer, staggerItem,
  OpenerCard,
} from '../components/ui'
import { useTranslation } from '../context/LanguageContext'
import ServiceFacts from '../components/ServiceFacts'
import PageH1 from '../components/PageH1'
import { getPageH1 } from '../lib/page-headings'
import { getExamples, getOpenerCards } from '../i18n/examples-data'

// ── ICON BOX — consistent icon container ─────────────────────────────────────
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

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const { t, lang } = useTranslation()
  const hookRef = useRef(null)
  const hookText = t('hero.hook')
  const seoH1 = getPageH1('/', lang)

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

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-radial from-gold/[0.07] to-transparent" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-navy/[0.05] to-transparent" />
        <div className="absolute inset-0 grain-overlay opacity-[0.028]" />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: headline + CTAs */}
          <motion.div {...fadeUp}>
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold mb-6">
              <span className="w-5 h-px bg-gold" />
              {t('hero.eyebrow')}
            </p>

            <PageH1 className="mb-4">{seoH1}</PageH1>

            <h2
              ref={hookRef}
              className="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-bold leading-[1.12] tracking-[-0.02em] text-ink mb-4"
            >
              {hookText}
            </h2>

            <motion.p {...fadeUp} transition={{ delay: 0.15, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="text-lg sm:text-xl text-muted leading-relaxed mb-4">
              {t('hero.subtitle')}{' '}
              <span className="font-display italic font-semibold text-ink">{t('hero.italic')}</span>
            </motion.p>

            <motion.div {...fadeUp} transition={{ delay: 0.35, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-2 text-[0.82rem] font-medium text-ink-2 mb-10">
              <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot" />
              {t('hero.stat')}
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.45, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="flex flex-wrap items-center gap-3 mb-5">
              <BtnPrimary to="/free-lines" large>{t('hero.cta1')}</BtnPrimary>
              <BtnGhost to="/book-call">{t('hero.cta2')}</BtnGhost>
            </motion.div>

            <motion.p {...fadeUp} transition={{ delay: 0.55, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="text-xs text-muted-2 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 4v3l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {t('hero.disclaimer')}
            </motion.p>

            <motion.div {...fadeUp} transition={{ delay: 0.6, duration: 0.7, ease:[0.32,0.72,0,1] }}
              className="flex flex-wrap gap-2 mt-10">
              {['Smartlead','Instantly','Lemlist','EmailBison','Clay','Apollo CSV'].map(tag => (
                <span key={tag} className="text-[0.72rem] font-medium bg-white border border-border text-muted rounded-full px-3 py-1.5 hover:border-border-2 transition-colors">
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: live opener preview */}
          <motion.div {...fadeUpBlur} transition={{ delay: 0.3, duration: 0.8, ease:[0.32,0.72,0,1] }}
            className="relative mt-10 lg:mt-0">
            <div className="relative pt-4 sm:pt-6 pb-8 sm:pb-10">
              <div className="bg-white border border-border rounded-xl3 p-5 sm:p-7 shadow-card relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-gold via-gold/50 to-transparent" />
                <p className="text-[0.65rem] sm:text-[0.68rem] font-bold uppercase tracking-[0.12em] text-emerald-700 flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {t('hero.preview.label')}
                </p>
                <p className="font-display italic text-[clamp(0.9rem,2.5vw,1rem)] leading-relaxed text-ink mb-5">
                  &ldquo;{t('hero.preview.quote')}&rdquo;
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
                  <div className="min-w-0">
                    <p className="text-[0.78rem] font-semibold text-ink-2">{t('hero.preview.role')}</p>
                    <p className="text-[0.72rem] text-muted italic mt-0.5">{t('hero.preview.signal')}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0" aria-label={t('hero.preview.qa')}>
                    {[1,2,3,4,5].map(d => <span key={d} className="w-2 h-2 rounded-full bg-gold" />)}
                  </div>
                </div>
              </div>

              <div className="absolute -top-1 right-3 sm:right-6 bg-navy text-white text-[0.65rem] sm:text-[0.72rem] font-semibold px-3 sm:px-3.5 py-1.5 rounded-full shadow-cta flex items-center gap-2 max-w-[calc(100%-1.5rem)]">
                <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot flex-shrink-0" />
                <span className="truncate">{t('hero.preview.badge')}</span>
              </div>

              {/* Fixed: shows the Dossier result (9.6%), not the pre-Dossier baseline */}
              <div className="absolute -bottom-3 left-3 sm:left-8 bg-white border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-card flex items-center gap-2 sm:gap-3 max-w-[calc(100%-1.5rem)]">
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-navy/80 to-transparent opacity-80" />
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

        <motion.div {...fadeUp} transition={{delay:0.3}} className="mt-14 text-center">
          <div className="inline-flex items-center gap-8 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-8 py-5 flex-wrap justify-center gap-y-4">
            {stats.map(s => (
              <div key={s.val} className="text-center">
                <div className="font-display text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-gold">{s.val}</div>
                <div className="text-[0.68rem] sm:text-[0.72rem] text-white/40 mt-1 max-w-[140px] mx-auto leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── AGITATION ────────────────────────────────────────────────────────────────
function Agitation() {
  const { t } = useTranslation()
  const stats = [
    { stat:'68%',  label: t('agitation.s1.label') },
    { stat:'3 sec', label: t('agitation.s2.label') },
    { stat:'$0',   label: t('agitation.s3.label') },
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

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
          className="flex flex-col sm:flex-row mt-12 rounded-2xl overflow-hidden border border-border bg-white divide-y sm:divide-y-0 sm:divide-x divide-border">
          {stats.map((s, i) => (
            <motion.div key={i} variants={staggerItem}
              className="flex-1 p-6 sm:p-8 text-center hover:bg-cream/60 transition-colors duration-200">
              <div className="font-display text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-navy mb-2">{s.stat}</div>
              <p className="text-[0.72rem] sm:text-[0.76rem] text-muted leading-snug">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </ContainerSm>
    </Section>
  )
}

// ── SOLUTION ─────────────────────────────────────────────────────────────────
function Solution() {
  const { t } = useTranslation()
  const features = [
    { Icon: Search,      title: t('solution.f1.title'), body: t('solution.f1.body') },
    { Icon: PenLine,     title: t('solution.f2.title'), body: t('solution.f2.body') },
    { Icon: ShieldCheck, title: t('solution.f3.title'), body: t('solution.f3.body') },
  ]
  return (
    <Section id="solution">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
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
            <div className="flex gap-3 mt-10">
              <BtnPrimary to="/free-lines">{t('solution.cta1')}</BtnPrimary>
              <BtnGhost to="/book-call">{t('solution.cta2')}</BtnGhost>
            </div>
          </motion.div>

          {/* CSV mockup */}
          <motion.div {...fadeUpBlur} transition={{ delay:0.2, duration:0.8, ease:[0.32,0.72,0,1] }}>
            <div className="bg-black/[0.025] border border-black/[0.05] p-1.5 rounded-xl4">
              <div className="bg-white rounded-[calc(2rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="bg-navy px-5 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    {[0,1,2].map(d => <div key={d} className="w-2.5 h-2.5 rounded-full bg-white/20" />)}
                  </div>
                  <span className="text-white/50 text-xs font-mono">dossier_batch_001.csv</span>
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
                  { name:'J. Whitmore', co:'LeadFlow', opener:'Your breakdown of why cold email collapsed 2023 to 2025 is the most precise articulation I\'ve seen published...', qa:4, conf:'High' },
                  { name:'M. Okafor', co:'Apex Outbound', opener:'Saw you launched in February and positioned around removing friction that every other tool buries in 5-step workflows...', qa:5, conf:'High' },
                  { name:'R. Castillo', co:'Clearpath B2B', opener:'Your thread on why SDR-to-AE handoffs break under 50 people is something I\'ve seen play out at 3 agencies this year...', qa:3, conf:'Med' },
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

// ── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    { n:'01', title: t('hiw.s1.title'), body: t('hiw.s1.body') },
    { n:'02', title: t('hiw.s2.title'), body: t('hiw.s2.body') },
    { n:'03', title: t('hiw.s3.title'), body: t('hiw.s3.body') },
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
          <div className="absolute hidden md:block top-[2.7rem] left-[calc(16.67%+0.5rem)] right-[calc(16.67%+0.5rem)] h-px bg-gradient-to-r from-gold/40 via-gold to-gold/40" aria-hidden="true" />
          {steps.map((s, i) => (
            <motion.div key={i} variants={staggerItem}
              initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
              transition={{ delay: i*0.12, duration:0.65, ease:[0.32,0.72,0,1] }}
              className="h-full">
              <Card hover className="h-full">
                <div className="w-11 h-11 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center mb-5 shadow-cta relative z-10" aria-hidden="true">
                  {s.n}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
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

        {/* Before / After columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2">

          {/* Before */}
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

          {/* After */}
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

// ── EXAMPLES ─────────────────────────────────────────────────────────────────
function Examples() {
  const { t, lang } = useTranslation()
  const examples = getExamples(lang)
  const openers = getOpenerCards(lang)
  return (
    <Section id="examples">
      <Container>

        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-12">
          <Eyebrow>{t('examples.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('examples.title')} <em className="italic text-gold">{t('examples.titleEm')}</em>
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto">{t('examples.sub')}</p>
        </motion.div>

        {/* 3 full before/after example blocks */}
        <div className="flex flex-col gap-4">
          {examples.map((ex, i) => <ExampleBlock key={ex.id} ex={ex} index={i} />)}
        </div>

        {/* Sample opener cards */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mt-16">
          <Eyebrow>{t('examples.openers.eyebrow')}</Eyebrow>
          <motion.div
            variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5"
          >
            {openers.map((o, i) => <OpenerCard key={i} {...o} />)}
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-12 text-center">
          <p className="text-sm text-muted mb-5">
            {t('examples.ctaNote')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <BtnPrimary to="/free-lines" large>{t('examples.cta1')}</BtnPrimary>
            <BtnGhost to="/book-call">{t('examples.cta2')}</BtnGhost>
          </div>
        </motion.div>

      </Container>
    </Section>
  )
}

// ── BENEFITS ─────────────────────────────────────────────────────────────────
function Benefits() {
  const { t } = useTranslation()
  const benefits = [
    { Icon: Zap,         title: t('benefits.b1.title'), body: t('benefits.b1.body') },
    { Icon: Target,      title: t('benefits.b2.title'), body: t('benefits.b2.body') },
    { Icon: BarChart2,   title: t('benefits.b3.title'), body: t('benefits.b3.body') },
    { Icon: Plug,        title: t('benefits.b4.title'), body: t('benefits.b4.body') },
    { Icon: Shield,      title: t('benefits.b5.title'), body: t('benefits.b5.body') },
    { Icon: TrendingUp,  title: t('benefits.b6.title'), body: t('benefits.b6.body') },
  ]
  const spans = ['sm:col-span-2','sm:col-span-1','sm:col-span-1','sm:col-span-2','sm:col-span-1','sm:col-span-2']
  return (
    <Section className="bg-cream-2">
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
              <Card hover className="h-full">
                <IconBox Icon={b.Icon} />
                <h3 className="font-semibold text-ink mb-1.5">{b.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{b.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}

// ── WHY US ────────────────────────────────────────────────────────────────────
function WhyUs() {
  const { t } = useTranslation()
  const features = [
    { title: t('whyus.f1.title'), body: t('whyus.f1.body') },
    { title: t('whyus.f2.title'), body: t('whyus.f2.body') },
    { title: t('whyus.f3.title'), body: t('whyus.f3.body') },
  ]
  const grid = [
    { Icon: Search,      label: t('whyus.g1') },
    { Icon: PenLine,     label: t('whyus.g2') },
    { Icon: ShieldCheck, label: t('whyus.g3') },
    { Icon: BarChart2,   label: t('whyus.g4') },
    { Icon: Plug,        label: t('whyus.g5') },
    { Icon: Shield,      label: t('whyus.g6') },
  ]
  return (
    <Section className="bg-navy-dark text-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
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

          <motion.div {...fadeUp} transition={{delay:0.2}} className="grid grid-cols-2 gap-3">
            {grid.map((item, i) => (
              <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-xl2 p-4 hover:bg-white/[0.08] transition-colors duration-200">
                <item.Icon className="w-5 h-5 text-gold mb-2" aria-hidden="true" />
                <p className="text-sm font-medium text-white/80 leading-tight">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
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
    <Section>
      <Container>
        <motion.div {...fadeUp} className="text-center mb-12">
          <Eyebrow>{t('cred.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('cred.title')} <em className="italic text-gold">{t('cred.titleEm')}</em>
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto">{t('cred.sub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="lg:col-span-3 grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} variants={staggerItem}
                className="bg-white border border-border rounded-xl2 p-6 text-center hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                <div className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-navy mb-2">{s.val}</div>
                <p className="text-xs text-muted leading-snug">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="lg:col-span-2">
            <div className="bg-cream-2 border border-border border-l-4 border-l-gold rounded-xl p-6 text-sm text-muted leading-relaxed h-full flex flex-col justify-center">
              <strong className="text-ink font-semibold block mb-2">{t('cred.note.bold')}</strong>
              {t('cred.note.body')}
            </div>
          </motion.div>
        </div>
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
      features: [t('pricing.starter.f1'), t('pricing.starter.f2'), t('pricing.starter.f3'), t('pricing.starter.f4')],
      cta: t('pricing.cta.start'), ctaTo: '/free-lines', highlight: false,
    },
    {
      name: t('pricing.growth.name'), price:'$999', unit:'/mo',
      prospects: t('pricing.growth.prospects'), desc: t('pricing.growth.desc'),
      features: [t('pricing.growth.f1'), t('pricing.growth.f2'), t('pricing.growth.f3'), t('pricing.growth.f4'), t('pricing.growth.f5')],
      cta: t('pricing.cta.start'), ctaTo: '/free-lines', highlight: true,
    },
    {
      name: t('pricing.agency.name'), price:'Custom', unit:'',
      prospects: t('pricing.agency.prospects'), desc: t('pricing.agency.desc'),
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
              <Card hover>
                <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-ink">{plan.price}</span>
                  <span className="text-muted text-sm">{plan.unit}</span>
                </div>
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

        <motion.div {...fadeUp} className="text-center mt-8">
          <Link to="/pricing" className="text-sm font-semibold text-navy hover:underline">
            {t('pricing.link')}
          </Link>
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
    <Section id="faq">
      <ContainerSm>
        <motion.div {...fadeUp} className="text-center mb-10">
          <Eyebrow>{t('faq.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            {t('faq.title')} <em className="italic text-gold">{t('faq.titleEm')}</em>
          </h2>
        </motion.div>
        <motion.div {...fadeUp} transition={{delay:0.1}} className="divide-y divide-border">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="py-0.5">
                <button
                  id={`faq-btn-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors group"
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
                  <div><p className="pb-4 text-sm text-muted leading-relaxed pr-10">{faq.a}</p></div>
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
  return (
    <Section className="bg-navy-dark">
      <Container>
        <motion.div {...fadeUp} className="relative bg-white/[0.04] border border-white/[0.07] rounded-xl4 p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold/[0.08] to-transparent" />
          </div>
          <div className="relative z-10">
            <Eyebrow light>{t('finalcta.eyebrow')}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-white mb-4">
              {t('finalcta.title1')} <em className="italic text-gold">{t('finalcta.titleEm')}</em>
            </h2>
            <p className="text-white/50 text-lg max-w-md mx-auto mb-10">{t('finalcta.sub')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <BtnPrimary to="/free-lines" large>{t('finalcta.cta1')}</BtnPrimary>
              <BtnGhost to="/book-call" light>{t('finalcta.cta2')}</BtnGhost>
            </div>
            <p className="text-white/25 text-xs mt-5">{t('finalcta.disclaimer')}</p>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
function HomeSeoIntro() {
  const { t } = useTranslation()
  return (
    <Section>
      <ContainerSm>
        <motion.article {...fadeUp} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-ink mb-5">
            {t('seoIntro.title')}
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            {t('seoIntro.p1')}
          </p>
          <p className="text-muted leading-relaxed mb-4">
            {t('seoIntro.p2')}
          </p>
          <blockquote className="border-l-2 border-gold pl-4 text-left text-ink-2 text-sm leading-relaxed italic">
            {t('seoIntro.quote')}
          </blockquote>
        </motion.article>
      </ContainerSm>
    </Section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceFacts titleKey="serviceFacts.title.home" className="bg-cream-2 py-12 sm:py-16" />
      <HomeSeoIntro />
      <Divider />
      <Problem />
      <Divider />
      <Agitation />
      <Divider />
      <Solution />
      <Divider />
      <HowItWorks />
      <Divider />
      <Examples />
      <Divider />
      <Benefits />
      <Divider />
      <WhyUs />
      <Divider />
      <Credibility />
      <Divider />
      <PricingPreview />
      <Divider />
      <FAQ />
      <FinalCTA />
    </>
  )
}
