import { useState } from 'react'
import { motion } from 'framer-motion'
import { Section, Container, ContainerSm, Eyebrow, BtnPrimary, BtnGhost, Card, Divider, fadeUp, staggerContainer, staggerItem } from '../components/ui'
import ServiceFacts from '../components/ServiceFacts'
import PageH1 from '../components/PageH1'
import { getPageH1 } from '../lib/page-headings'
import { useTranslation } from '../context/LanguageContext'

export default function Pricing() {
  const { lang } = useTranslation()
  const isFr = lang === 'fr'
  const h1 = getPageH1('/pricing', lang)
  const [openFaq, setOpenFaq] = useState(null)

  const plans = [
    {
      name: isFr ? 'Starter' : 'Starter',
      price: '499',
      unit: isFr ? '/mois' : '/mo',
      prospects: isFr ? '500 prospects/mois' : '500 prospects/month',
      ideal: isFr ? 'Pour les fondateurs et petites équipes B2B qui démarrent l’outbound.' : 'For founders and small B2B teams starting outbound.',
      features: isFr
        ? [
            '3 variantes d’accroche notées QA par prospect',
            'Livraison CSV compatible avec tout séquenceur',
            'Délai 24 à 48 heures',
            'Score de confiance et source du signal inclus',
            'Signal faible : prospects signalés, pas masqués',
            'Support par email',
          ]
        : [
            '3 QA-scored opener variants per lead',
            'CSV delivery compatible with any sequencer',
            '24 to 48 hour turnaround',
            'Confidence scoring and signal source included',
            'Thin-profile flagging included',
            'Email support',
          ],
      cta: isFr ? 'Commencer avec 100 gratuits' : 'Start with 100 Free',
      ctaTo: '/free-lines',
      highlight: false,
    },
    {
      name: isFr ? 'Growth' : 'Growth',
      price: '999',
      unit: isFr ? '/mois' : '/mo',
      prospects: isFr ? '2 000 prospects/mois' : '2,000 prospects/month',
      ideal: isFr ? 'Pour les agences et équipes B2B qui scalent le cold email.' : 'For agencies and B2B teams scaling cold email campaigns.',
      features: isFr
        ? [
            'Tout ce qui est dans Starter',
            'File prioritaire',
            'Planification par lots',
            'Livraison API pour intégrations',
            'Relecture QA dédiée',
            'Support Slack',
          ]
        : [
            'Everything in Starter',
            'Priority processing queue',
            'Batch scheduling at custom intervals',
            'API delivery for CRM integration',
            'Dedicated QA reviewer for your campaigns',
            'Slack support channel',
          ],
      cta: isFr ? 'Commencer avec 100 gratuits' : 'Start with 100 Free',
      ctaTo: '/free-lines',
      highlight: true,
    },
    {
      name: isFr ? 'Agency' : 'Agency',
      price: isFr ? 'Sur devis' : 'Custom',
      unit: '',
      prospects: isFr ? 'Prospects illimités' : 'Unlimited prospects',
      ideal: isFr ? 'Pour les agences à gros volume qui gèrent plusieurs clients.' : 'For high-volume agencies managing multiple client campaigns.',
      features: isFr
        ? [
            'Tout ce qui est dans Growth',
            'Livraison en marque blanche',
            'Lots segmentés par client',
            'Garantie de délai (SLA)',
            'Account manager dédié',
            'Intégrations sur demande',
          ]
        : [
            'Everything in Growth',
            'White-label CSV delivery',
            'Client-segmented batch processing',
            'SLA turnaround guarantee',
            'Dedicated account manager',
            'Custom integrations on request',
          ],
      cta: isFr ? 'Réserver un appel' : 'Book a Call',
      ctaTo: '/book-call',
      highlight: false,
    },
  ]

  const comparison = [
    { feature: isFr ? 'Prospects par mois' : 'Prospects per month', starter: '500', growth: '2,000', agency: isFr ? 'Illimité' : 'Unlimited' },
    { feature: isFr ? 'Variantes par prospect' : 'Opener variants per lead', starter: '3', growth: '3', agency: '3' },
    { feature: isFr ? 'Scoring QA' : 'QA scoring pass', starter: true, growth: true, agency: true },
    { feature: isFr ? 'Rapport de confiance' : 'Confidence reporting', starter: true, growth: true, agency: true },
    { feature: isFr ? 'Livraison CSV' : 'CSV delivery', starter: true, growth: true, agency: true },
    { feature: isFr ? 'Livraison API' : 'API delivery', starter: false, growth: true, agency: true },
    { feature: isFr ? 'Priorité de traitement' : 'Priority queue', starter: false, growth: true, agency: true },
    { feature: isFr ? 'Relecture QA dédiée' : 'Dedicated QA reviewer', starter: false, growth: true, agency: true },
    { feature: isFr ? 'Marque blanche' : 'White-label delivery', starter: false, growth: false, agency: true },
    { feature: isFr ? 'Garantie SLA' : 'SLA guarantee', starter: false, growth: false, agency: true },
    { feature: isFr ? 'Support Slack' : 'Slack support', starter: false, growth: true, agency: true },
  ]

  const faqs = isFr
    ? [
        {
          q: 'Le pilote 100 lignes est vraiment gratuit ?',
          a: 'Oui. 100 prospects, aucune carte, aucun engagement. On livre trois variantes notées QA par prospect sous 48 heures.',
        },
        {
          q: 'Qu’est-ce qui compte comme un prospect ?',
          a: 'Chaque ligne de votre CSV compte comme un prospect. Les profils à faible signal sont marqués et n’entament pas votre volume mensuel.',
        },
        {
          q: 'Je peux mettre en pause ou annuler ?',
          a: 'Oui. Les plans mensuels se mettent en pause ou s’arrêtent à tout moment. Pas d’annuel imposé sur Starter ou Growth.',
        },
        {
          q: 'Comment fonctionne le plan Agency ?',
          a: 'Le pricing dépend du volume, des délais et des intégrations. Réservez un appel : on vous fait une proposition sous 24 heures.',
        },
        {
          q: 'Que faites-vous des leads “low confidence” ?',
          a: 'Ils restent visibles dans le livrable avec un flag et la raison. Vous décidez de les exclure, de les retenter, ou d’utiliser une variante plus prudente.',
        },
      ]
    : [
        {
          q: 'Is the 100 free lines pilot really free?',
          a: 'Yes. 100 prospects, no credit card, no commitment. We deliver three QA-scored openers per lead within 48 hours.',
        },
        {
          q: 'What counts as a prospect toward my monthly limit?',
          a: 'Each row in your CSV counts as one prospect. Low-confidence profiles are flagged and do not count toward your monthly volume.',
        },
        {
          q: 'Can I pause or cancel anytime?',
          a: 'Yes. Monthly plans can be paused or cancelled at any time. No annual contracts unless you request one for a discount.',
        },
        {
          q: 'How does billing work for the Agency plan?',
          a: 'Agency pricing depends on volume, delivery speed, and integration requirements. Book a call and we will send a proposal within 24 hours.',
        },
        {
          q: 'What happens to prospects that get flagged as low-confidence?',
          a: 'They remain visible in your deliverable with a flag and the reason. You decide whether to exclude them, retry later, or use a safer opener variant.',
        },
      ]
  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-0">
        <Container>
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <Eyebrow>{isFr ? 'Tarifs' : 'Pricing'}</Eyebrow>
            <PageH1>{h1}</PageH1>
            <p className="mt-5 text-muted text-lg leading-relaxed">
              {isFr
                ? 'Chaque plan commence par un pilote gratuit de 100 prospects. Pas de carte. Pas d’engagement. On gagne votre confiance en battant votre baseline.'
                : 'Every plan starts with a free 100-prospect pilot. No credit card. No commitment. We earn your business by beating your current baseline first.'}
            </p>
            <p className="mt-4 text-muted text-sm leading-relaxed max-w-xl mx-auto">
              {isFr
                ? 'Starter (499$/mois) couvre 500 prospects. Growth (999$/mois) monte à 2 000 avec livraison API et QA prioritaire. Agency : marque blanche, SLA, intégrations. Tous les plans livrent 3 variantes notées QA et un délai 24–48 h.'
                : 'Starter ($499/mo) covers 500 researched prospects per month. Growth ($999/mo) scales to 2,000 prospects with API delivery and priority QA. Agency teams get white-label CSVs, SLAs, and custom integrations. All plans include three QA-scored opener variants per lead and 24 to 48 hour delivery.'}
            </p>
          </motion.div>
        </Container>
      </Section>

      <ServiceFacts titleKey="serviceFacts.title.pricing" className="bg-cream-2 py-12 sm:py-16" />

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
            <Eyebrow>{isFr ? 'Comparatif' : 'Comparison'}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {isFr ? 'Ce qui est inclus ' : 'What is included '}
              <em className="italic text-gold">{isFr ? 'dans chaque plan.' : 'in each plan.'}</em>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} transition={{delay:0.1}} className="overflow-x-auto">
            <div className="bg-black/[0.025] border border-black/[0.05] rounded-xl3 p-1.5 min-w-[600px]">
              <div className="bg-white rounded-[calc(1.5rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="bg-navy text-left text-white/70 font-semibold text-xs uppercase tracking-wider px-5 py-3.5 rounded-tl-[calc(1.5rem-5px)]">
                        {isFr ? 'Fonction' : 'Feature'}
                      </th>
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
            <Eyebrow>{isFr ? 'FAQ Tarifs' : 'Pricing FAQ'}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {isFr ? 'Questions sur ' : 'Questions about '}
              <em className="italic text-gold">{isFr ? 'les tarifs.' : 'pricing.'}</em>
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="divide-y divide-border">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
              <div key={i}>
                <button onClick={() => setOpenFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`pricing-faq-${i}`}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors group">
                  <span>{faq.q}</span>
                  <span aria-hidden="true" className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen?'bg-navy text-white border-navy rotate-45':'border-border-2 text-muted'}`}>+</span>
                </button>
                <div id={`pricing-faq-${i}`} role="region" className={`faq-body ${isOpen?'open':''}`}>
                  <div><p className="pb-4 text-sm text-muted leading-relaxed pr-10">{faq.a}</p></div>
                </div>
              </div>
              )
            })}
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
              <BtnGhost to="/book-call" light>Book a 30 Min Call</BtnGhost>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
