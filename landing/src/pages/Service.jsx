import { motion } from 'framer-motion'
import { Search, PenLine, ShieldCheck, FileSpreadsheet } from 'lucide-react'
import {
  Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost, Card,
  fadeUp, staggerContainer, staggerItem,
} from '../components/ui'
import PageH1 from '../components/PageH1'
import ServiceFacts from '../components/ServiceFacts'
import { getPageH1 } from '../lib/page-headings'
import { useTranslation } from '../context/LanguageContext'
import { getServiceContent } from '../i18n/service-data'

const STEP_ICONS = [Search, PenLine, ShieldCheck, FileSpreadsheet]

export default function Service() {
  const { lang } = useTranslation()
  const c = getServiceContent(lang)
  const h1 = getPageH1('/service', lang)

  return (
    <>
      <Section className="pt-28 sm:pt-32 pb-0">
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <Eyebrow>{c.hero.eyebrow}</Eyebrow>
            <PageH1 className="mb-5">{h1}</PageH1>
            <p className="text-muted text-lg leading-relaxed mb-4">
              {c.hero.p1}
            </p>
            <p className="text-muted text-base leading-relaxed">
              {c.hero.p2}
            </p>
          </motion.div>
        </ContainerSm>
      </Section>

      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{c.pipeline.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.pipeline.title}
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {c.pipeline.steps.map((step, i) => {
              const Icon = STEP_ICONS[i]
              return (
                <motion.div key={step.title} variants={staggerItem}>
                  <Card hover className="h-full">
                    <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-navy" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-ink mb-2">{step.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{step.body}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </Container>
      </Section>

      <ServiceFacts titleKey="serviceFacts.title.service" className="bg-cream-2 py-12 sm:py-16" />

      <Section>
        <ContainerSm>
          <motion.div {...fadeUp}>
            <Eyebrow>{c.deliverables.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold mb-6">
              {c.deliverables.title}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {c.deliverables.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <BtnPrimary to="/free-lines">{c.deliverables.cta1}</BtnPrimary>
              <BtnGhost to="/pricing">{c.deliverables.cta2}</BtnGhost>
              <BtnGhost to="/contact">{c.deliverables.cta3}</BtnGhost>
            </div>
          </motion.div>
        </ContainerSm>
      </Section>
    </>
  )
}
