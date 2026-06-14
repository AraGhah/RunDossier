import { motion } from 'framer-motion'
import {
  Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost,
  Card, Divider, fadeUp, staggerContainer, staggerItem,
} from '../components/ui'

// ── PLACEHOLDER BLOCK ─────────────────────────────────────────────────────────
function Placeholder({ label, hint, tall }) {
  return (
    <div className={`w-full border-2 border-dashed border-gold/30 bg-gold/[0.03] rounded-xl2 flex flex-col items-center justify-center text-center p-8 ${tall ? 'min-h-[220px]' : 'min-h-[100px]'}`}>
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-gold mb-1">{label}</span>
      {hint && <span className="text-xs text-muted-2 max-w-xs leading-relaxed mt-1">{hint}</span>}
    </div>
  )
}

export default function About() {
  return (
    <>
      {/* ── HERO / MISSION ─────────────────────────────────────────────── */}
      <Section className="pt-32 pb-16">
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow>About Dossier</Eyebrow>
            <div className="mb-6">
              <Placeholder
                label="Main headline"
                hint="One powerful sentence that captures your mission or the reason Dossier exists."
                tall
              />
            </div>
            <Placeholder
              label="Sub-headline / intro paragraph"
              hint="2 to 3 sentences describing what Dossier is, who it is for, and why it matters. Goes directly under the headline."
            />
          </motion.div>
        </ContainerSm>
      </Section>

      <Divider />

      {/* ── OUR STORY ──────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Where it started.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <motion.div {...fadeUp} className="flex flex-col gap-4">
              <Placeholder label="Story paragraph 1" hint="The context. What was happening in the industry or in your own work that led to creating Dossier." tall />
              <Placeholder label="Story paragraph 2" hint="The turning point. What you saw, experienced, or discovered that made you decide to build this." tall />
              <Placeholder label="Story paragraph 3" hint="What Dossier is today. Where you are now and what the mission looks like in practice." tall />
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="flex flex-col gap-4">
              <Placeholder label="Key milestone 1 — year + event" hint="e.g. 2023 — saw reply rates collapse across 3 agency campaigns" tall />
              <Placeholder label="Key milestone 2 — year + event" hint="e.g. 2024 — started building the research pipeline" tall />
              <Placeholder label="Key milestone 3 — year + event" hint="e.g. 2025 — first pilot cohort achieves 9.6% reply rate" tall />
              <Placeholder label="Key milestone 4 — year + event" hint="e.g. 2025 — Dossier publicly launches" tall />
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── MISSION & WHAT WE DO ───────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>What we do</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              The problem we solve.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card hover>
                <Placeholder label="Problem we solve" hint="Describe the core pain: what is broken in cold outbound that Dossier fixes." tall />
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <Card hover>
                <Placeholder label="How we solve it" hint="Describe your approach: research pipeline, QA scoring, CSV delivery, etc." tall />
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
              <Card hover>
                <Placeholder label="The result" hint="What clients get on the other side: better reply rates, time saved, credibility." tall />
              </Card>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── FOUNDER ────────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>The founder</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              The person behind Dossier.
            </h2>
          </motion.div>
          <div className="max-w-2xl mx-auto">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">Ara Ghahramanyan</h3>
                <p className="text-sm text-muted mt-1">Founder, Dossier</p>
              </div>
              <Placeholder label="Short bio — sentence 1" hint="Your background. Where you come from and what you were doing before Dossier." tall />
              <Placeholder label="Short bio — sentence 2" hint="What led you specifically to start Dossier. The personal reason." tall />
              <Placeholder label="Short bio — sentence 3" hint="What you care about most in your work. A belief or principle that drives you." tall />
              <Placeholder label="Founder quote" hint="One memorable quote that captures your perspective on cold email, outbound, or personalization." tall />
              <div className="grid grid-cols-2 gap-3">
                <Placeholder label="LinkedIn URL (optional)" hint="Will appear as a link on this page." />
                <Placeholder label="X / Twitter (optional)" hint="Only include if you actively post there." />
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── VALUES ─────────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>Our values</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What we refuse to compromise on.
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <Placeholder label={`Value ${i} — icon + title + description`} hint="e.g. Research before everything — we start with signals, not prompts." tall />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* ── WHO WE SERVE ───────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>Who we serve</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Good fit and not a fit.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card hover>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4">Good fit</p>
                <div className="flex flex-col gap-3">
                  {[1,2,3,4,5].map(i => (
                    <Placeholder key={i} label={`Good fit criterion ${i}`} hint="e.g. Cold email agencies managing client campaigns" />
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <Card hover>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4">Not a fit</p>
                <div className="flex flex-col gap-3">
                  {[1,2,3,4,5].map(i => (
                    <Placeholder key={i} label={`Not a fit criterion ${i}`} hint="e.g. B2C outreach or consumer products" />
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── CONTACT ────────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>Contact</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Get in touch.
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Placeholder label="Email address" hint="Your business or contact email." tall />
            <Placeholder label="Booking / Cal.com embed" hint="Zoom + Teams on /book-call. Set VITE_CAL_ZOOM_LINK and VITE_CAL_TEAMS_LINK (20–30 min events)." tall />
            <Placeholder label="Other contact method (optional)" hint="LinkedIn DM, X DM, or a contact form URL." tall />
          </motion.div>
        </ContainerSm>
      </Section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
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
