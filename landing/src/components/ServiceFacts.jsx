import { motion } from 'framer-motion'
import { getServiceFacts } from '../i18n/service-facts-data'
import { useTranslation } from '../context/LanguageContext'
import { Section, ContainerSm, Eyebrow, fadeUp } from './ui'

export default function ServiceFacts({ titleKey = 'serviceFacts.title.default', className = '' }) {
  const { lang, t } = useTranslation()
  const facts = getServiceFacts(lang)

  return (
    <Section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      <ContainerSm>
        <motion.div {...fadeUp}>
          <Eyebrow>{t('serviceFacts.eyebrow')}</Eyebrow>
          <h2 className="font-display text-[clamp(1.35rem,2.8vw,2rem)] font-bold tracking-tight text-ink mb-6">
            {t(titleKey)}
          </h2>
          <dl className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {facts.map(({ term, detail }) => (
              <div
                key={term}
                className="rounded-xl border border-border bg-white/70 px-4 py-3.5 sm:px-5 sm:py-4"
              >
                <dt className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-2 sm:text-[0.68rem]">
                  {term}
                </dt>
                <dd className="text-[0.82rem] leading-relaxed text-ink-2 sm:text-sm">{detail}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </ContainerSm>
    </Section>
  )
}
