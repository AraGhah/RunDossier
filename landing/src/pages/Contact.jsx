import { motion } from 'framer-motion'
import { Mail, Calendar, Linkedin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Section, ContainerSm, Eyebrow, BtnPrimary, BtnGhost, Card,
  fadeUp, staggerContainer, staggerItem,
} from '../components/ui'
import PageH1 from '../components/PageH1'
import ContactBlock from '../components/ContactBlock'
import { getPageH1 } from '../lib/page-headings'
import { useTranslation } from '../context/LanguageContext'
import { getContactContent } from '../i18n/contact-data'
import { LEGAL_EMAIL, LEGAL_JURISDICTION, LEGAL_PHONE, LEGAL_CITY, legalPhoneDisplay, legalPhoneTel } from '../lib/legal'
import { calBookingUrl } from '../lib/cal'

const LINKEDIN_URL = 'https://www.linkedin.com/in/ara-ghahramanyan-086261405/'

export default function Contact() {
  const { lang } = useTranslation()
  const c = getContactContent(lang)
  const h1 = getPageH1('/contact', lang)

  const cards = [
    {
      Icon: Mail,
      ...c.cards.email,
      action: LEGAL_EMAIL,
      href: `mailto:${LEGAL_EMAIL}`,
    },
    ...(LEGAL_PHONE
      ? [{
          Icon: Phone,
          ...c.cards.phone,
          action: legalPhoneDisplay(),
          href: `tel:${legalPhoneTel()}`,
        }]
      : []),
    {
      Icon: Calendar,
      ...c.cards.bookCall,
      action: c.cards.bookCall.action,
      href: calBookingUrl('zoom'),
      external: true,
    },
    {
      Icon: Linkedin,
      ...c.cards.linkedin,
      action: c.cards.linkedin.action,
      href: LINKEDIN_URL,
      external: true,
    },
  ]

  return (
    <>
      <Section className="pt-28 sm:pt-32 pb-0">
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <Eyebrow>{c.hero.eyebrow}</Eyebrow>
            <PageH1 className="mb-5">{h1}</PageH1>
            <p className="text-muted text-lg leading-relaxed">
              {c.hero.intro(LEGAL_CITY)}
            </p>
          </motion.div>
        </ContainerSm>
      </Section>

      <Section className="bg-cream-2">
        <ContainerSm>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {cards.map((item) => (
              <motion.div key={item.title} variants={staggerItem}>
                <Card hover className="h-full">
                  <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4">
                    <item.Icon className="w-5 h-5 text-navy" aria-hidden="true" />
                  </div>
                  <h2 className="font-semibold text-ink text-sm mb-2">{item.title}</h2>
                  <p className="text-sm text-muted leading-relaxed mb-4">{item.body}</p>
                  <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="text-sm font-semibold text-navy underline underline-offset-2 hover:text-navy-2 break-all"
                  >
                    {item.action}
                  </a>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="mt-10 rounded-xl border border-border bg-white/70 p-6">
            <h2 className="font-display text-xl font-bold text-ink mb-3">{c.business.title}</h2>
            <ContactBlock />
            <p className="mt-4 text-sm text-muted leading-relaxed">
              {c.business.operator(LEGAL_JURISDICTION)}{' '}
              {c.business.privacyPrefix}{' '}
              <Link to="/privacy" className="text-navy underline underline-offset-2 hover:text-navy-2">
                {c.business.privacyLink}
              </Link>.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="mt-8 flex flex-wrap gap-3 justify-center">
            <BtnPrimary to="/free-lines">{c.cta1}</BtnPrimary>
            <BtnGhost to="/service">{c.cta2}</BtnGhost>
          </motion.div>
        </ContainerSm>
      </Section>
    </>
  )
}
