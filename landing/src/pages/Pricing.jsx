import { useState } from 'react'
import { motion } from 'framer-motion'
import { Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost, Card, Divider, fadeUp, staggerContainer, staggerItem } from '../components/ui'

const plans = [
  {
    name: 'Starter',
    price: '499',
    unit: '/mo',
    prospects: '500 prospects/month',
    ideal: 'For founders and small B2B teams starting outbound.',
    features: [
      '3 QA-scored opener variants per lead',
      'CSV delivery compatible with any sequencer',
      '24 to 48 hour turnaround',
      'Confidence scoring and signal source included',
      'Thin-profile flagging included',
      'Email support',
    ],
    cta: 'Start with 100 Free',
    ctaTo: '/free-lines',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '999',
    unit: '/mo',
    prospects: '2,000 prospects/month',
    ideal: 'For agencies and B2B teams scaling cold email campaigns.',
    features: [
      'Everything in Starter',
      'Priority processing queue',
      'Batch scheduling at custom intervals',
      'API delivery for CRM integration',
      'Dedicated QA reviewer for your campaigns',
      'Slack support channel',
    ],
    cta: 'Start with 100 Free',
    ctaTo: '/free-lines',
    highlight: true,
  },
  {
    name: 'Agency',
    price: 'Custom',
    unit: '',
    prospects: 'Unlimited prospects',
    ideal: 'For high-volume agencies managing multiple client campaigns.',
    features: [
      'Everything in Growth',
      'White-label CSV delivery',
      'Client-segmented batch processing',
      'SLA turnaround guarantee',
      'Dedicated account manager',
      'Custom integrations on request',
    ],
    cta: 'Book a Call',
    ctaTo: '/book-call',
    highlight: false,
  },
]

const comparison = [
  { feature: 'Prospects per month', starter: '500', growth: '2,000', agency: 'Unlimited' },
  { feature: 'Opener variants per lead', starter: '3', growth: '3', agency: '3' },
  { feature: 'QA scoring pass', starter: true, growth: true, agency: true },
  { feature: 'Confidence reporting', starter: true, growth: true, agency: true },
  { feature: 'CSV delivery', starter: true, growth: true, agency: true },
  { feature: 'API delivery', starter: false, growth: true, agency: true },
  { feature: 'Priority queue', starter: false, growth: true, agency: true },
  { feature: 'Dedicated QA reviewer', starter: false, growth: true, agency: true },
  { feature: 'White-label delivery', starter: false, growth: false, agency: true },
  { feature: 'SLA guarantee', starter: false, growth: false, agency: true },
  { feature: 'Slack support', starter: false, growth: true, agency: true },
]

const faqs = [
  { q: 'Is the 100 free lines pilot really free?', a: 'Yes. 100 prospects, no credit card, no commitment. We research and write three QA-scored openers per lead and deliver within 48 hours. If the openers beat your baseline, we talk about a paid plan. If not, there is no conversation to have.' },
  { q: 'What counts as a prospect toward my monthly limit?', a: 'Each row in your CSV counts as one prospect. We research each one and write three opener variants. Prospects flagged as low-confidence do not count toward your monthly limit.' },
  { q: 'Can I pause or cancel anytime?', a: 'Yes. Monthly plans can be paused or cancelled at any time. There are no annual contracts on the Starter or Growth plans unless you specifically request one for a discount.' },
  { q: 'How does billing work for the Agency plan?', a: 'Agency pricing is based on volume, delivery speed, and integration requirements. Book a 20–30 minute call and we will put together a custom proposal within 24 hours.' },
  { q: 'What happens to prospects that get flagged as low-confidence?', a: 'They appear in your deliverable with a flag and a note explaining what signal was missing. You decide whether to pull them from the campaign, use the lower-confidence opener, or re-queue them.' },
]

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState(null)
  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-0">
        <Container>
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.1] tracking-tight">
              Simple pricing.<br /><em className="italic text-gold">Start free, scale when it works.</em>
            </h1>
            <p className="mt-5 text-muted text-lg leading-relaxed">
              Every plan starts with a free 100-prospect pilot. No credit card. No commitment. We earn your business by beating your current baseline first.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* Pricing cards */}
      <Section>
        <Container>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true}}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map((plan, i) => (
              <motion.div key={i} variants={staggerItem}
                className={`relative ${plan.highlight ? 'md:-mt-4' : ''}`}
                style={{ borderRadius: 'calc(1.5rem + 6px)' }}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-navy text-white text-[0.65rem] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full z-10 shadow-cta">
                    Most popular
                  </div>
                )}
                <div className={`${plan.highlight ? 'ring-2 ring-navy rounded-xl3' : ''}`}>
                  <Card hover>
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      {plan.price === 'Custom' ? (
                        <span className="font-display text-4xl font-bold text-ink">Custom</span>
                      ) : (
                        <>
                          <span className="font-display text-5xl font-bold text-ink">${plan.price}</span>
                          <span className="text-muted">{plan.unit}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gold font-semibold mb-3">{plan.prospects}</p>
                    <p className="text-sm text-muted mb-6 leading-relaxed border-b border-border pb-5">{plan.ideal}</p>
                    <ul className="space-y-3 mb-7">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <svg className="text-gold flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-ink-2">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <BtnPrimary to={plan.ctaTo} className="w-full justify-center">{plan.cta}</BtnPrimary>
                  </Card>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="text-center mt-6">
            <p className="text-sm text-muted">
              All plans include the free 100-prospect pilot. No credit card required to start.
            </p>
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* Comparison table */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>Comparison</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What is included <em className="italic text-gold">in each plan.</em>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} transition={{delay:0.1}} className="overflow-x-auto">
            <div className="bg-black/[0.025] border border-black/[0.05] rounded-xl3 p-1.5 min-w-[600px]">
              <div className="bg-white rounded-[calc(1.5rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="bg-navy text-left text-white/70 font-semibold text-xs uppercase tracking-wider px-5 py-3.5 rounded-tl-[calc(1.5rem-5px)]">Feature</th>
                      {['Starter','Growth','Agency'].map((h,i,arr) => (
                        <th key={h} className={`bg-navy text-center text-white font-semibold text-xs uppercase tracking-wider px-4 py-3.5 ${h==='Growth'?'text-gold':''} ${i===arr.length-1?'rounded-tr-[calc(1.5rem-5px)]':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${i%2===1?'bg-cream/50':''} hover:bg-cream transition-colors`}>
                        <td className="px-5 py-3 text-ink-2">{row.feature}</td>
                        {[row.starter, row.growth, row.agency].map((val, j) => (
                          <td key={j} className="px-4 py-3 text-center">
                            {typeof val === 'boolean' ? (
                              val
                                ? <svg className="text-emerald-600 mx-auto" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : <svg className="text-muted-2 mx-auto" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                            ) : (
                              <span className="font-medium text-ink">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* FAQ */}
      <Section>
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>Pricing FAQ</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Questions about <em className="italic text-gold">pricing.</em>
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="divide-y divide-border">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors group">
                  <span>{faq.q}</span>
                  <span className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq===i?'bg-navy text-white border-navy rotate-45':'border-border-2 text-muted'}`}>+</span>
                </button>
                <div className={`faq-body ${openFaq===i?'open':''}`}>
                  <div><p className="pb-4 text-sm text-muted leading-relaxed pr-10">{faq.a}</p></div>
                </div>
              </div>
            ))}
          </motion.div>
        </ContainerSm>
      </Section>

      {/* CTA */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>Get started today</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-4">
              Start with 100 prospects, <em className="italic text-gold">free.</em>
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-8 leading-relaxed">
              No credit card. No campaign access. Pilot results in 24 to 48 hours. If the openers beat your baseline, we talk about a plan.
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
