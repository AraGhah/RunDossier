import { useState } from 'react'
import { motion } from 'framer-motion'
import { Section, ContainerSm, Eyebrow, fadeUp } from './ui'

export default function LegalFaq({ title, eyebrow, faqs, idPrefix }) {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <Section className="bg-cream-2">
      <ContainerSm>
        <motion.div {...fadeUp} className="text-center mb-10">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-[1.2] tracking-tight">
            {title}
          </h2>
        </motion.div>
        <motion.div {...fadeUp} className="divide-y divide-border">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`${idPrefix}-faq-${i}`}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors"
                >
                  <span>{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-navy text-white border-navy rotate-45' : 'border-border-2 text-muted'}`}
                  >
                    +
                  </span>
                </button>
                <div id={`${idPrefix}-faq-${i}`} role="region" className={`faq-body ${isOpen ? 'open' : ''}`}>
                  <p className="pb-4 text-sm text-muted leading-relaxed pr-10">{faq.a}</p>
                </div>
              </div>
            )
          })}
        </motion.div>
      </ContainerSm>
    </Section>
  )
}
