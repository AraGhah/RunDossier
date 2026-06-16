import { motion } from 'framer-motion'
import { Section, ContainerSm, Eyebrow, fadeUp } from '../components/ui'
import PageH1 from '../components/PageH1'
import LegalFaq from '../components/LegalFaq'
import LegalPolicyBody from '../components/LegalPolicyBody'
import { getPageH1 } from '../lib/page-headings'
import { useTranslation } from '../context/LanguageContext'
import { getTermsFaq } from '../lib/site-data'
import { getTermsContent } from '../i18n/terms-data'
import {
  LEGAL_ENTITY,
  LEGAL_OPERATOR,
  LEGAL_WEBSITE,
  LEGAL_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_JURISDICTION,
  LEGAL_CITY,
} from '../lib/legal'

export default function Terms() {
  const { lang } = useTranslation()
  const h1 = getPageH1('/terms', lang)
  const faqs = getTermsFaq(lang)
  const vars = {
    entity: LEGAL_ENTITY,
    operator: LEGAL_OPERATOR,
    website: LEGAL_WEBSITE,
    websiteHost: LEGAL_WEBSITE.replace('https://', ''),
    email: LEGAL_EMAIL,
    city: LEGAL_CITY,
    jurisdiction: LEGAL_JURISDICTION,
  }
  const c = getTermsContent(lang, vars)

  return (
    <>
      <Section className="pt-32 pb-10">
        <ContainerSm>
          <motion.div {...fadeUp} className="mb-10">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <PageH1 className="mb-3">{h1}</PageH1>
            <p className="text-muted text-sm mb-4">{c.lastUpdatedLabel} {LEGAL_LAST_UPDATED}</p>
            <p className="text-muted leading-relaxed text-[0.95rem]">{c.intro}</p>
          </motion.div>

          <LegalPolicyBody sections={c.sections} />
        </ContainerSm>
      </Section>

      <LegalFaq
        eyebrow={c.faqEyebrow}
        title={c.faqTitle}
        faqs={faqs}
        idPrefix="terms"
      />
    </>
  )
}
