import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion'
import {
  CheckCircle, XCircle, Mail, Linkedin, Phone,
  Search, Award, Zap, Heart, Calendar,
  ArrowRight,
} from 'lucide-react'
import {
  Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost,
  Card, Divider, fadeUp, fadeUpBlur, staggerContainer, staggerItem,
} from '../components/ui'
import { LEGAL_EMAIL, LEGAL_PHONE, legalPhoneDisplay, legalPhoneTel } from '../lib/legal'
import ServiceFacts from '../components/ServiceFacts'
import PageH1 from '../components/PageH1'
import { getPageH1 } from '../lib/page-headings'
import { useTranslation } from '../context/LanguageContext'
import { getAboutContent } from '../i18n/about-data'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const LINKEDIN_URL = 'https://www.linkedin.com/in/ara-ghahramanyan-086261405/'

// ── COUNT-UP ANIMATION ────────────────────────────────────────────────────────
function CountUp({ to, suffix = '', prefix = '', duration = 1.6, isDecimal }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: v => setValue(isDecimal ? Math.round(v * 10) / 10 : Math.round(v)),
    })
    return controls.stop
  }, [inView, to, duration, isDecimal])

  return (
    <span ref={ref}>
      {prefix}{isDecimal ? value.toFixed(1) : value.toLocaleString()}{suffix}
    </span>
  )
}

// ── FOUNDER CARD ──────────────────────────────────────────────────────────────
function FounderCard({ roleCard, tags }) {
  return (
    <div className="relative w-full max-w-[360px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gold/30 to-navy/20 blur-3xl scale-110 opacity-50 pointer-events-none" />

      <motion.div
        className="relative rounded-[2rem] bg-gradient-to-br from-navy via-navy to-navy-2 border border-white/[0.09] shadow-[0_32px_80px_rgba(15,25,35,0.55)] overflow-hidden"
        whileHover={{ scale: 1.018, y: -4 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Grain */}
        <div className="absolute inset-0 grain-overlay opacity-[0.055]" />

        {/* Decorative grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.055]"
          viewBox="0 0 360 420"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="0" y1="140" x2="360" y2="140" stroke="white" strokeWidth="0.8" />
          <line x1="0" y1="280" x2="360" y2="280" stroke="white" strokeWidth="0.8" />
          <line x1="120" y1="0" x2="120" y2="420" stroke="white" strokeWidth="0.8" />
          <line x1="240" y1="0" x2="240" y2="420" stroke="white" strokeWidth="0.8" />
          <circle cx="180" cy="190" r="130" stroke="white" strokeWidth="0.7" />
          <circle cx="180" cy="190" r="70" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Top accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-gold/[0.18] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-navy-2/60 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center px-8 pt-14 pb-10 text-center">
          {/* Monogram circle */}
          <motion.div
            className="w-[108px] h-[108px] rounded-full border border-gold/35 bg-gradient-to-br from-gold/20 to-gold/05 flex items-center justify-center mb-6 shadow-[0_0_48px_rgba(184,151,90,0.22)]"
            animate={{ scale: [1, 1.035, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <span className="font-display text-[3.2rem] font-bold text-white/90 leading-none select-none">A</span>
          </motion.div>

          <h3 className="font-display text-[1.35rem] font-bold text-white leading-tight tracking-tight mb-1">
            Ara Ghahramanyan
          </h3>
          <p className="text-[0.68rem] text-gold/75 uppercase tracking-[0.14em] font-semibold mb-6">
            {roleCard}
          </p>

          {/* Divider line */}
          <div className="w-10 h-px bg-gold/25 mb-6" />

          {/* Role tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[0.62rem] font-semibold uppercase tracking-wider bg-white/[0.06] border border-white/[0.08] text-white/50 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Dossier label */}
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-white/20 mt-8">Dossier</p>
        </div>
      </motion.div>
    </div>
  )
}

// ── TIMELINE ──────────────────────────────────────────────────────────────────
function TimelineItem({ milestone, index, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.65, delay: index * 0.07, ease: [0.32, 0.72, 0, 1] }}
      className="relative flex gap-5 items-start"
    >
      {/* Tag */}
      <div className="flex-shrink-0 w-[90px] text-right pt-0.5">
        <span className="inline-block text-[0.6rem] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 rounded-full px-2.5 py-1 whitespace-nowrap leading-tight">
          {milestone.tag}
        </span>
      </div>

      {/* Dot + line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: index * 0.07 + 0.2 }}
          className="w-3 h-3 rounded-full bg-gold border-2 border-cream-2 shadow-[0_0_0_3px_rgba(184,151,90,0.22)] mt-1 z-10 flex-shrink-0"
        />
        {!isLast && (
          <motion.div
            className="w-px bg-gradient-to-b from-gold/35 to-gold/04 mt-1"
            style={{ minHeight: '64px', flex: 1 }}
            initial={{ scaleY: 0, originY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.75, delay: index * 0.07 + 0.3, ease: [0.32, 0.72, 0, 1] }}
          />
        )}
      </div>

      {/* Text */}
      <div className="pb-10 flex-1 min-w-0">
        <h3 className="font-display text-[1rem] font-semibold text-ink mb-1.5 leading-snug">{milestone.title}</h3>
        <p className="text-muted leading-relaxed text-[0.855rem]">{milestone.body}</p>
      </div>
    </motion.div>
  )
}

const VALUE_ICONS = [Search, Award, Zap, Heart]
const WHAT_WE_DO_ICONS = [XCircle, Search, CheckCircle]

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function About() {
  const { lang } = useTranslation()
  const c = getAboutContent(lang)
  const h1 = getPageH1('/about', lang)
  const { scrollY } = useScroll()
  const glow1Y = useTransform(scrollY, [0, 600], [0, -80])
  const glow2Y = useTransform(scrollY, [0, 600], [0, 40])

  const contactCards = [
    {
      Icon: Mail,
      ...c.contact.cards[0],
      action: LEGAL_EMAIL,
      href: `mailto:${LEGAL_EMAIL}`,
    },
    ...(LEGAL_PHONE
      ? [{
          Icon: Phone,
          ...c.contact.cards[1],
          action: legalPhoneDisplay(),
          href: `tel:${legalPhoneTel()}`,
        }]
      : []),
    {
      Icon: Calendar,
      ...c.contact.cards[2],
      action: c.contact.cards[2].action,
      to: '/book-call',
    },
    {
      Icon: Linkedin,
      ...c.contact.cards[3],
      action: c.contact.cards[3].action,
      href: LINKEDIN_URL,
    },
  ]

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 sm:pt-36 sm:pb-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y: glow1Y }}
            className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-radial from-gold/[0.08] to-transparent"
          />
          <motion.div
            style={{ y: glow2Y }}
            className="absolute -bottom-1/4 -left-1/4 w-[520px] h-[520px] rounded-full bg-gradient-radial from-navy/[0.05] to-transparent"
          />
          <div className="absolute inset-0 grain-overlay opacity-[0.025]" />
        </div>

        <ContainerSm className="relative z-10">
          <motion.div {...fadeUpBlur} className="text-center">
            <Eyebrow>{c.hero.eyebrow}</Eyebrow>
            <PageH1 className="text-ink mb-7">{h1}</PageH1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto mb-5">
              {c.hero.p1}
            </p>
            <p className="text-base text-muted-2 leading-relaxed max-w-xl mx-auto">
              {c.hero.p2}
            </p>
          </motion.div>
        </ContainerSm>
      </section>

      <ServiceFacts titleKey="serviceFacts.title.about" className="bg-cream-2 py-12 sm:py-16" />

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <div className="bg-navy border-y border-white/[0.06] py-10 sm:py-12">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 divide-x-0 lg:divide-x divide-white/[0.07]"
          >
            {c.stats.map((s, i) => (
              <motion.div key={i} variants={staggerItem} className="text-center px-4">
                <div className="font-display text-[clamp(2rem,4vw,2.8rem)] font-bold text-white leading-none mb-2">
                  <CountUp to={s.value} suffix={s.suffix} isDecimal={s.isDecimal} />
                </div>
                <div className="text-[0.7rem] text-white/35 uppercase tracking-[0.11em] font-medium leading-snug max-w-[140px] mx-auto">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </div>

      <Divider />

      {/* ── FOUNDER ───────────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-14">
            <Eyebrow>{c.founder.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.founder.title}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center max-w-4xl mx-auto">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <FounderCard roleCard={c.founder.roleCard} tags={c.founder.tags} />
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
              <div>
                <h3 className="font-display text-[2rem] font-bold text-ink leading-tight tracking-tight">
                  Ara Ghahramanyan
                </h3>
                <p className="text-gold font-semibold mt-2 text-[0.73rem] uppercase tracking-[0.14em]">
                  {c.founder.role}
                </p>
              </div>

              <p className="text-muted leading-relaxed text-[0.93rem]">
                {c.founder.p1}
              </p>

              <p className="text-muted leading-relaxed text-[0.93rem]">
                {c.founder.p2}
              </p>

              <p className="text-muted leading-relaxed text-[0.93rem]">
                {c.founder.p3}
              </p>

              {/* Pullquote */}
              <motion.div
                className="relative pl-5 border-l-[3px] border-gold my-1 py-1"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25 }}
              >
                <p className="font-display italic text-ink-2 leading-relaxed text-[0.97rem]">
                  &ldquo;{c.founder.quote}&rdquo;
                </p>
                <p className="text-[0.72rem] text-muted mt-3 font-medium not-italic">
                  {c.founder.quoteAttribution}
                </p>
              </motion.div>

              {/* Social links */}
              <div className="flex gap-3 pt-1">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={c.founder.linkedinAria}
                  className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-navy underline underline-offset-2 hover:text-navy-2 border border-border-2 hover:border-navy/30 hover:bg-navy/[0.04] rounded-full px-4 py-2.5 transition-all duration-200"
                >
                  <Linkedin className="w-3.5 h-3.5" aria-hidden="true" />
                  {c.founder.linkedin}
                </a>
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  aria-label={`Email ${LEGAL_EMAIL}`}
                  className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-navy underline underline-offset-2 hover:text-navy-2 border border-border-2 hover:border-navy/30 hover:bg-navy/[0.04] rounded-full px-4 py-2.5 transition-all duration-200"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  {c.founder.email}
                </a>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── ORIGIN STORY ──────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-14">
            <Eyebrow>{c.timeline.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.timeline.title1}<br />
              <em className="italic text-gold">{c.timeline.titleEm}</em>
            </h2>
          </motion.div>

          <div className="max-w-[660px] mx-auto">
            {c.timeline.milestones.map((m, i) => (
              <TimelineItem key={m.tag} milestone={m} index={i} isLast={i === c.timeline.milestones.length - 1} />
            ))}
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── WHAT WE DO ────────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{c.whatWeDo.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.whatWeDo.title}
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch"
          >
            {c.whatWeDo.cards.map((item, i) => {
              const Icon = WHAT_WE_DO_ICONS[i]
              const colorCls = i === 0 ? 'text-red-500' : i === 1 ? 'text-navy' : 'text-emerald-600'
              const bgCls = i === 0 ? 'bg-red-50' : i === 1 ? 'bg-navy/[0.06]' : 'bg-emerald-50'
              return (
              <motion.div key={item.label} variants={staggerItem} className="h-full">
                <Card hover className="h-full">
                  <div className={`w-10 h-10 rounded-xl ${bgCls} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${colorCls}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-[1rem] font-semibold text-ink mb-2.5 leading-snug">{item.label}</h3>
                  <p className="text-muted text-[0.87rem] leading-relaxed">{item.body}</p>
                </Card>
              </motion.div>
              )
            })}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* ── VALUES ────────────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{c.values.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.values.title}
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch"
          >
            {c.values.items.map((v, i) => {
              const Icon = VALUE_ICONS[i]
              return (
              <motion.div key={v.title} variants={staggerItem} className="h-full">
                <Card hover className="h-full">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gold" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-[0.95rem] font-semibold text-ink mb-2 leading-snug">{v.title}</h3>
                  <p className="text-muted text-[0.83rem] leading-relaxed">{v.body}</p>
                </Card>
              </motion.div>
              )
            })}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* ── WHO WE SERVE ──────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{c.fit.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.fit.title}
            </h2>
            <p className="text-muted mt-4 max-w-md mx-auto text-[0.87rem] leading-relaxed">
              {c.fit.sub}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto items-stretch">
            <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="h-full">
              <Card hover className="h-full">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 mb-5">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" /> {c.fit.goodLabel}
                </p>
                <div className="flex flex-col gap-3.5">
                  {c.fit.good.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[6px] flex-shrink-0" />
                      <p className="text-[0.84rem] text-muted leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.16 }} className="h-full">
              <Card hover className="h-full">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-red-500 flex items-center gap-2 mb-5">
                  <XCircle className="w-4 h-4" aria-hidden="true" /> {c.fit.badLabel}
                </p>
                <div className="flex flex-col gap-3.5">
                  {c.fit.bad.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-[6px] flex-shrink-0" />
                      <p className="text-[0.84rem] text-muted leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── CONTACT ───────────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{c.contact.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.contact.title}
            </h2>
            <p className="text-muted mt-3 max-w-sm mx-auto text-[0.87rem] leading-relaxed">
              {c.contact.sub}
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch"
          >
            {contactCards.map((item, i) => (
              <motion.div key={i} variants={staggerItem} className="h-full">
                <Card hover className="h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4">
                    <item.Icon className="w-5 h-5 text-navy" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-ink text-sm mb-1">{item.title}</h3>
                  <p className="text-[0.75rem] text-muted mb-4 flex-1">{item.desc}</p>
                  {item.to ? (
                    <BtnGhost to={item.to} className="text-xs !py-2 !px-3.5 self-start">
                      {item.action}
                    </BtnGhost>
                  ) : (
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-navy hover:text-navy-2 underline underline-offset-2 break-all transition-colors"
                    >
                      {item.action}
                      <ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </ContainerSm>
      </Section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>{c.cta.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.13] text-white mb-5">
              {c.cta.title1}<br />
              <em className="italic text-gold">{c.cta.titleEm}</em>
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-8 leading-relaxed text-[0.93rem]">
              {c.cta.sub}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <BtnPrimary to="/free-lines" large>{c.cta.cta1}</BtnPrimary>
              <BtnGhost to="/book-call" light>{c.cta.cta2}</BtnGhost>
            </div>
            <p className="text-white/20 text-xs mt-6">
              {c.cta.disclaimer}
            </p>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
