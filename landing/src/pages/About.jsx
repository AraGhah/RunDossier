import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion'
import {
  CheckCircle, XCircle, Mail, Linkedin,
  Search, Award, Zap, Heart, Calendar,
} from 'lucide-react'
import {
  Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost,
  Card, Divider, fadeUp, fadeUpBlur, staggerContainer, staggerItem,
} from '../components/ui'

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

// ── FOUNDER AVATAR ────────────────────────────────────────────────────────────
function FounderAvatar() {
  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gold/25 to-navy/15 blur-3xl scale-110 opacity-60" />
      <motion.div
        className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-navy to-navy-2 overflow-hidden border border-white/10 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="absolute inset-0 grain-overlay opacity-[0.06]" />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 340 340" fill="none" preserveAspectRatio="none">
          <line x1="0" y1="113" x2="340" y2="113" stroke="white" strokeWidth="0.8"/>
          <line x1="0" y1="227" x2="340" y2="227" stroke="white" strokeWidth="0.8"/>
          <line x1="113" y1="0" x2="113" y2="340" stroke="white" strokeWidth="0.8"/>
          <line x1="227" y1="0" x2="227" y2="340" stroke="white" strokeWidth="0.8"/>
          <circle cx="170" cy="170" r="110" stroke="white" strokeWidth="0.8"/>
          <circle cx="170" cy="170" r="60" stroke="white" strokeWidth="0.5"/>
        </svg>
        {/* Gold accent top-right */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/20 to-transparent" />
        {/* Monogram */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="w-28 h-28 rounded-full border border-gold/40 bg-gradient-to-br from-gold/25 to-gold/5 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(184,151,90,0.2)]"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="font-display text-5xl font-bold text-white/90">A</span>
          </motion.div>
          <p className="font-display text-xl font-semibold text-white/90 tracking-tight">Ara Ghahramanyan</p>
          <p className="text-sm text-gold/80 mt-1.5 uppercase tracking-[0.1em] font-medium">Founder & CEO</p>
          <div className="w-12 h-px bg-gold/30 mt-4" />
          <p className="text-[0.7rem] text-white/30 mt-3 uppercase tracking-widest">Dossier</p>
        </div>
      </motion.div>
    </div>
  )
}

// ── TIMELINE DATA ─────────────────────────────────────────────────────────────
const milestones = [
  {
    year: '2022',
    title: 'The frustration begins',
    body: 'Managing outbound campaigns for B2B clients, Ara watched reply rates plummet as inboxes overflowed with identical GPT-drafted openers. Every personalization tool promised scale — none delivered genuine research.',
  },
  {
    year: '2023',
    title: 'Testing everything on the market',
    body: 'Tried every AI writing tool, LinkedIn scraper, and enrichment platform available. The problem was always the same: the tools could write fast, but none could actually read a prospect\'s signal and turn it into something worth replying to.',
  },
  {
    year: 'Q1 2024',
    title: 'Building the research pipeline',
    body: 'Started designing Dossier from scratch: deep research first — LinkedIn, podcasts, company announcements — then AI-assisted drafting, then a QA scoring layer. Signal → Draft → Score → Deliver.',
  },
  {
    year: 'Q3 2024',
    title: 'First pilot cohort',
    body: 'Ran the first external cohort across 100 prospects. Average reply rate: 9.6%. The research-first approach worked. Agencies started asking for access.',
  },
  {
    year: '2025',
    title: 'Public launch',
    body: 'Dossier opens to the public with Starter, Growth, and Agency tiers. Every customer starts with 100 free lines — no credit card, no campaign access required — because we\'d rather prove the product than pitch it.',
  },
]

function TimelineItem({ milestone, index, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] }}
      className="relative flex gap-5 items-start"
    >
      {/* Year */}
      <div className="flex-shrink-0 w-[82px] text-right pt-0.5">
        <span className="inline-block text-[0.65rem] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 rounded-full px-2.5 py-1 whitespace-nowrap">
          {milestone.year}
        </span>
      </div>
      {/* Dot + vertical line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.08 + 0.2 }}
          className="w-3 h-3 rounded-full bg-gold border-2 border-cream-2 shadow-[0_0_0_3px_rgba(184,151,90,0.25)] mt-1 z-10"
        />
        {!isLast && (
          <motion.div
            className="w-px bg-gradient-to-b from-gold/40 to-gold/05 flex-1 mt-1"
            initial={{ scaleY: 0, originY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: index * 0.08 + 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ minHeight: '64px' }}
          />
        )}
      </div>
      {/* Content */}
      <div className="pb-10 flex-1">
        <h3 className="font-display text-lg font-semibold text-ink mb-1.5 leading-tight">{milestone.title}</h3>
        <p className="text-muted leading-relaxed text-[0.88rem]">{milestone.body}</p>
      </div>
    </motion.div>
  )
}

// ── VALUES DATA ───────────────────────────────────────────────────────────────
const values = [
  {
    Icon: Search,
    title: 'Research before everything',
    body: 'Every opener we write traces to a real, verifiable signal. No signal, no opener. We would rather send 3 perfect lines than 50 weak ones.',
  },
  {
    Icon: Award,
    title: 'Quality over volume',
    body: 'A QA scoring layer removes openers that are too generic, too risky, or too weak. Your list gets our best work — not our average work.',
  },
  {
    Icon: Zap,
    title: 'Human + machine, honestly',
    body: 'AI drafts at scale. Humans design the research pipeline and QA criteria. We\'re transparent about what each layer does — and doesn\'t do.',
  },
  {
    Icon: Heart,
    title: 'Honest about fit',
    body: 'We tell you when Dossier isn\'t the right tool. We\'d rather lose the deal than overpromise. Reputation is the only moat that compounds.',
  },
]

// ── STATS DATA ────────────────────────────────────────────────────────────────
const stats = [
  { value: 12000, suffix: '+', label: 'Prospects researched' },
  { value: 9.6, suffix: '%', label: 'Avg. reply rate', isDecimal: true },
  { value: 48, suffix: 'h', label: 'Delivery turnaround' },
  { value: 3, suffix: 'x', label: 'QA-scored openers / prospect' },
]

// ── GOOD FIT / NOT A FIT ──────────────────────────────────────────────────────
const goodFit = [
  'Cold email agencies managing multiple client campaigns',
  'B2B founders running their own outbound motion',
  'SDR teams sending 50–500 personalised emails per week',
  'Growth teams that understand personalisation starts with research',
  'Anyone who would rather send 10 great emails than 1,000 generic ones',
]

const notFit = [
  'B2C outreach or consumer product campaigns',
  'Companies that just want to blast high-volume sequences',
  'Teams without a sequencer or sending infrastructure in place',
  'Anyone unwilling to provide a clean, enriched prospect list',
  'Businesses that expect overnight results without testing',
]

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function About() {
  const { scrollY } = useScroll()
  const glow1Y = useTransform(scrollY, [0, 500], [0, -70])
  const glow2Y = useTransform(scrollY, [0, 500], [0, 35])

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y: glow1Y }}
            className="absolute -top-1/4 -right-1/4 w-[650px] h-[650px] rounded-full bg-gradient-radial from-gold/[0.08] to-transparent"
          />
          <motion.div
            style={{ y: glow2Y }}
            className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-navy/[0.05] to-transparent"
          />
          <div className="absolute inset-0 grain-overlay opacity-[0.028]" />
        </div>

        <ContainerSm className="relative z-10">
          <motion.div {...fadeUpBlur} className="text-center">
            <Eyebrow>About Dossier</Eyebrow>
            <h1 className="font-display text-[clamp(2.6rem,5.5vw,4rem)] font-bold leading-[1.08] tracking-tight text-ink mb-6">
              We make cold email<br />
              <em className="italic text-gold">feel human again.</em>
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto mb-5">
              Dossier is a research-backed personalisation engine for B2B outbound. We dig into your prospects' signals — LinkedIn posts, podcasts, product launches, company announcements — and turn them into cold email openers that earn a reply.
            </p>
            <p className="text-base text-muted-2 leading-relaxed max-w-xl mx-auto">
              Not a template tool. Not a prompt-to-spam machine. A research pipeline with a QA scoring layer, built for agencies and founders who know the first line is the only line that matters.
            </p>
          </motion.div>
        </ContainerSm>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <div className="bg-navy border-y border-white/[0.06] py-10">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-white/[0.07]"
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={staggerItem} className="text-center">
                <div className="font-display text-[clamp(2rem,4vw,2.8rem)] font-bold text-white leading-none mb-2">
                  <CountUp to={s.value} suffix={s.suffix} isDecimal={s.isDecimal} />
                </div>
                <div className="text-[0.72rem] text-white/35 uppercase tracking-[0.12em] font-medium">{s.label}</div>
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
            <Eyebrow>The founder</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              The person behind Dossier.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center max-w-4xl mx-auto">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <FounderAvatar />
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="flex flex-col gap-5">
              <div>
                <h3 className="font-display text-3xl font-bold text-ink leading-tight">Ara Ghahramanyan</h3>
                <p className="text-gold font-semibold mt-1.5 text-[0.78rem] uppercase tracking-[0.12em]">Founder & CEO, Dossier</p>
              </div>

              <p className="text-muted leading-relaxed text-[0.93rem]">
                I spent three years running outbound campaigns for B2B companies — agencies, SaaS startups, consulting firms. Reply rates were strong when we researched manually. They collapsed the moment we tried to scale. The gap was always the first line.
              </p>

              <p className="text-muted leading-relaxed text-[0.93rem]">
                By 2023, every inbox was flooded with GPT-drafted openers that referenced nothing real. Reply rates dropped industry-wide. Prospects started ignoring anything that felt templated. The tools supposed to fix personalisation were making the problem worse — because they all skipped the research.
              </p>

              <p className="text-muted leading-relaxed text-[0.93rem]">
                Dossier exists to solve the problem I had as a practitioner: research at scale, not just prompting at scale. Every opener we deliver comes from a real, verifiable signal. That is the whole model.
              </p>

              {/* Pullquote */}
              <motion.div
                className="relative pl-5 border-l-[3px] border-gold my-1 py-1"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25 }}
              >
                <p className="font-display italic text-ink-2 leading-relaxed text-[0.97rem]">
                  "The best cold email opener proves you actually looked. Dossier makes that possible for every prospect on your list — at scale."
                </p>
                <p className="text-[0.72rem] text-muted mt-2.5 font-medium">— Ara Ghahramanyan, Founder</p>
              </motion.div>

              {/* Social */}
              <div className="flex gap-3 pt-1">
                <a
                  href="https://linkedin.com/in/araghahramanyan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-muted hover:text-navy border border-border-2 hover:border-navy/30 hover:bg-navy/[0.03] rounded-full px-4 py-2 transition-all duration-200"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
                <a
                  href="mailto:ara@getdossier.com"
                  className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-muted hover:text-navy border border-border-2 hover:border-navy/30 hover:bg-navy/[0.03] rounded-full px-4 py-2 transition-all duration-200"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </a>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── OUR STORY / TIMELINE ──────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-14">
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              How we got here.
            </h2>
          </motion.div>

          <div className="max-w-[640px] mx-auto">
            {milestones.map((m, i) => (
              <TimelineItem key={i} milestone={m} index={i} isLast={i === milestones.length - 1} />
            ))}
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── WHAT WE DO ────────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>What we do</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              The problem we solve.
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {[
              {
                Icon: XCircle,
                colorCls: 'text-red-500',
                bgCls: 'bg-red-50',
                label: 'The problem',
                body: 'Cold email personalisation is broken. Tools that promise scale without research produce openers that apply to everyone — and convert no one. Inboxes are smarter than ever. Generic does not work anymore.',
              },
              {
                Icon: Search,
                colorCls: 'text-navy',
                bgCls: 'bg-navy/[0.06]',
                label: 'How we solve it',
                body: 'A three-stage pipeline: deep prospect research across LinkedIn, podcasts, and company news; AI-assisted drafting of 3 opener variants per prospect; QA scoring to remove anything below the bar.',
              },
              {
                Icon: CheckCircle,
                colorCls: 'text-emerald-600',
                bgCls: 'bg-emerald-50',
                label: 'The result',
                body: 'A CSV of research-backed openers, QA-scored and ready for your sequencer. Average reply rates of 8–12% across campaigns. Delivered in 24–48 hours. No campaign access. No credit card to start.',
              },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <div className={`w-10 h-10 rounded-xl ${item.bgCls} flex items-center justify-center mb-4`}>
                    <item.Icon className={`w-5 h-5 ${item.colorCls}`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink mb-2.5">{item.label}</h3>
                  <p className="text-muted text-[0.88rem] leading-relaxed">{item.body}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* ── VALUES ────────────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>Our values</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What we refuse to compromise on.
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {values.map((v, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/15 flex items-center justify-center mb-4">
                    <v.Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="font-display text-[0.97rem] font-semibold text-ink mb-2 leading-snug">{v.title}</h3>
                  <p className="text-muted text-[0.83rem] leading-relaxed">{v.body}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* ── WHO WE SERVE ──────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>Who we serve</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Good fit and not a fit.
            </h2>
            <p className="text-muted mt-4 max-w-md mx-auto text-[0.88rem] leading-relaxed">
              We'd rather be honest upfront than spend both our time on a campaign that won't work.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card hover>
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 mb-5">
                  <CheckCircle className="w-4 h-4" /> Good fit
                </p>
                <div className="flex flex-col gap-3.5">
                  {goodFit.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[6px] flex-shrink-0" />
                      <p className="text-[0.84rem] text-muted leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
              <Card hover>
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-red-500 flex items-center gap-2 mb-5">
                  <XCircle className="w-4 h-4" /> Not a fit
                </p>
                <div className="flex flex-col gap-3.5">
                  {notFit.map((item, i) => (
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
            <Eyebrow>Contact</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Get in touch.
            </h2>
            <p className="text-muted mt-3 max-w-sm mx-auto text-[0.88rem] leading-relaxed">
              Want to talk through a specific use case, or see if Dossier is right for your team? Reach out directly.
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                Icon: Mail,
                title: 'Email',
                desc: 'Direct line to Ara',
                action: 'ara@getdossier.com',
                href: 'mailto:ara@getdossier.com',
              },
              {
                Icon: Calendar,
                title: 'Book a call',
                desc: '20–30 min Zoom',
                action: 'Pick a time →',
                to: '/book-call',
              },
              {
                Icon: Linkedin,
                title: 'LinkedIn',
                desc: 'Follow for updates',
                action: 'Connect',
                href: 'https://linkedin.com/in/araghahramanyan',
              },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <div className="w-10 h-10 rounded-xl bg-navy/[0.06] flex items-center justify-center mb-4">
                    <item.Icon className="w-5 h-5 text-navy" />
                  </div>
                  <h3 className="font-semibold text-ink text-sm mb-1">{item.title}</h3>
                  <p className="text-[0.75rem] text-muted mb-3">{item.desc}</p>
                  {item.to ? (
                    <BtnGhost to={item.to} className="text-xs !py-1.5 !px-3">{item.action}</BtnGhost>
                  ) : (
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-[0.78rem] font-medium text-navy hover:text-navy-2 underline underline-offset-2 break-all transition-colors"
                    >
                      {item.action}
                    </a>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </ContainerSm>
      </Section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>Ready to start?</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-4">
              Start with 100 prospects, <em className="italic text-gold">free.</em>
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-8 leading-relaxed">
              No credit card. No campaign access. Openers delivered in 48 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <BtnPrimary to="/free-lines" large>Claim 100 Free Lines</BtnPrimary>
              <BtnGhost to="/book-call" light>Book a 20–30 min Call</BtnGhost>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
