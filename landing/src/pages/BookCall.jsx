import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, User, ClipboardList, TrendingUp, Rocket, HelpCircle, Hand, Search, PenLine, BarChart2 } from 'lucide-react'
import CalBookingEmbed from '../components/CalBookingEmbed'
import ContactBlock from '../components/ContactBlock'
import ServiceFacts from '../components/ServiceFacts'
import PageH1 from '../components/PageH1'
import { getPageH1 } from '../lib/page-headings'
import { LEGAL_CITY, LEGAL_EMAIL, LEGAL_BUSINESS_HOURS } from '../lib/legal'
import { calBookingUrl, CAL_MEETING_DURATION_LABEL, CAL_HOST_NAME } from '../lib/cal'
import { Section, Container, ContainerSm, Eyebrow, BtnPrimary, Card, Divider, fadeUp, staggerContainer, staggerItem } from '../components/ui'
import { useTranslation } from '../context/LanguageContext'

export default function BookCall() {
  const { lang } = useTranslation()
  const isFr = lang === 'fr'
  const h1 = getPageH1('/book-call', lang)
  const [openFaq, setOpenFaq] = useState(null)

  const agenda = isFr
    ? [
        { n: '01', title: 'Comprendre votre ICP et vos résultats', body: 'On parle cible, séquenceur, baseline de reply rate et ce que vous avez déjà testé. Cinq minutes.' },
        { n: '02', title: 'Montrer un exemple live de votre niche', body: 'On prend un prospect réel et on montre à quoi ressemble une accroche Dossier (recherche incluse). Pas seulement un rendu.' },
        { n: '03', title: 'Décider si le pilote a du sens', body: 'Si ce n’est pas un bon fit, on le dit. Si c’est un fit, on cale la prochaine étape : votre pilote gratuit de 100 prospects.' },
      ]
    : [
        { n: '01', title: 'Understand your ICP and current results', body: 'We ask about your target market, your sequencer, your baseline reply rate, and what you have already tried. Five minutes.' },
        { n: '02', title: 'Walk through a live example from your niche', body: 'We pull up a real prospect and show what a Dossier opener looks like (including the research), not just the output.' },
        { n: '03', title: 'Confirm whether the pilot makes sense', body: 'If Dossier is not a fit, we say so. If it is, we align on the next step: your free 100-prospect pilot.' },
      ]

  const forWho = isFr
    ? [
        { Icon: Building2, label: 'Agences cold email', desc: 'Vous gérez plusieurs clients et vous devez scaler la personnalisation sur plusieurs ICP.' },
        { Icon: User, label: 'Fondateurs B2B en outbound', desc: 'Vous faites du cold email vous-même et voulez améliorer le reply rate avant de recruter.' },
        { Icon: ClipboardList, label: 'Équipes SDR', desc: 'Vous envoyez 500+ emails/semaine et le reply rate pilote la perf.' },
        { Icon: TrendingUp, label: 'Ops / lead gen', desc: 'Vous faites du volume et les accroches génériques ne marchent plus.' },
      ]
    : [
        { Icon: Building2, label: 'Cold email agencies', desc: 'Managing campaigns for multiple clients and needing to scale personalization across ICPs.' },
        { Icon: User, label: 'B2B founders doing outbound', desc: 'Running your own cold email and wanting to improve reply rates before hiring an SDR team.' },
        { Icon: ClipboardList, label: 'SDR teams', desc: 'Sending 500 or more emails per week where reply rate is the metric that determines headcount.' },
        { Icon: TrendingUp, label: 'Lead gen operators', desc: 'Running high-volume campaigns where generic openers have already stopped working.' },
      ]

  const faqs = isFr
    ? [
        { q: 'C’est un call de vente ?', a: 'Non. C’est une évaluation de fit. On regarde vos résultats, votre ICP, et on vous montre un exemple concret.' },
        { q: 'Je dois préparer quelque chose ?', a: 'Rien de formel. Avoir une idée de votre reply rate et de votre cible aide, mais on guide le reste.' },
        { q: 'Que se passe-t-il après ?', a: 'Si on valide le fit, vous envoyez la liste sous 24 h et on livre 100 accroches sous 48 h.' },
        { q: 'Et si je dois déplacer le créneau ?', a: 'Vous pouvez replanifier à tout moment via le calendrier Cal.com. Aucun frais.' },
        { q: 'Le pilote gratuit est-il disponible sans call ?', a: 'Oui. Le call aide juste à calibrer la recherche et le premier lot.' },
      ]
    : [
        { q: 'Is this a sales call?', a: 'No. It is a fit assessment. We review your ICP and results and show a real example from your niche.' },
        { q: 'What do I need to prepare?', a: 'Nothing formal. A rough reply-rate baseline and who you target helps, but we will guide the rest.' },
        { q: 'What happens after the call?', a: 'If we agree the pilot makes sense, you send your list within 24 hours and we deliver 100 openers within 48 hours.' },
        { q: 'What if I cannot attend the scheduled time?', a: 'You can reschedule anytime through the Cal.com booking calendar. There is no penalty.' },
        { q: 'Is the 100 free lines offer available without a call?', a: 'Yes. The call just helps us calibrate the first batch.' },
      ]

  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-navy/[0.04] to-transparent" />
        </div>
        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp}>
              <Eyebrow>{isFr ? `Réserver un appel de ${CAL_MEETING_DURATION_LABEL}` : `Book a ${CAL_MEETING_DURATION_LABEL} call`}</Eyebrow>
              <PageH1 className="mb-5">{h1}</PageH1>
              <p className="text-muted text-lg leading-relaxed mb-4">
                {isFr
                  ? `Appel gratuit de 30 minutes avec ${CAL_HOST_NAME} (fondateur, Dossier, ${LEGAL_CITY}, Québec, Canada) via Zoom ou Microsoft Teams — réservez sur cal.com/preframe. On confirme votre ICP, on montre un exemple d'accroche QA-scorée depuis votre niche, et on décide si le pilote gratuit 100 prospects (CSV sous 24–48 h, $0) a du sens.`
                  : `Free 30 minute call with ${CAL_HOST_NAME} (Founder, Dossier, ${LEGAL_CITY}, Quebec, Canada) via Zoom or Microsoft Teams, book at cal.com/preframe. We review your ICP, show a live QA-scored opener from your niche, and confirm whether the free 100 prospect pilot (3 variants each, CSV in 24 to 48 h, $0) fits your campaign.`}
              </p>
              <p className="text-muted text-sm leading-relaxed mb-8">
                {isFr
                  ? `Créneaux disponibles ${LEGAL_BUSINESS_HOURS}. Vous pouvez aussi écrire à ${LEGAL_EMAIL} si vous préférez une prise en charge async avant le call.`
                  : `Available ${LEGAL_BUSINESS_HOURS}. You can also email ${LEGAL_EMAIL} if you prefer async intake before booking.`}
              </p>
              <div className="flex flex-col gap-3 text-sm">
                {(isFr
                  ? [
                      `${CAL_MEETING_DURATION_LABEL} via Zoom ou Microsoft Teams`,
                      'Exemple live depuis votre niche',
                      'Évaluation de fit directe, sans blabla',
                      'Décision pilote en fin de call si c’est un fit',
                      'Aucun engagement',
                    ]
                  : [
                      `${CAL_MEETING_DURATION_LABEL} via Zoom or Microsoft Teams`,
                      'Live example from your specific niche',
                      'Direct fit assessment, no fluff',
                      'Pilot plan agreed by end of call if there is a fit',
                      'No commitment to move forward',
                    ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg className="text-gold flex-shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-ink-2">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Cal.com embed placeholder */}
            <motion.div {...fadeUp} transition={{delay:0.2}}>
              <div className="bg-black/[0.025] border border-black/[0.05] p-1.5 rounded-xl4">
                <div className="bg-white rounded-[calc(2rem-5px)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <CalBookingEmbed />
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Who it is for */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{isFr ? 'Pour qui' : 'Who this call is for'}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {isFr ? 'Ce call a du sens si vous êtes ' : 'The call makes sense if you are '}
              <em className="italic text-gold">{isFr ? 'dans ce cas.' : 'one of these.'}</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {forWho.map((item,i) => (
              <motion.div key={i} variants={staggerItem} className="h-full">
                <Card hover className="h-full">
                  <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4">
                    <item.Icon className="w-5 h-5 text-navy" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-ink mb-1.5 text-sm">{item.label}</h3>
                  <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* Agenda */}
      <Section>
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{isFr ? 'Agenda' : 'What we cover'}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {isFr ? 'Ce qui se passe ' : 'Exactly what happens '}
              <em className="italic text-gold">{isFr ? 'pendant le call.' : 'during the call.'}</em>
            </h2>
            <p className="mt-3 text-muted max-w-lg mx-auto">
              {isFr
                ? `${CAL_MEETING_DURATION_LABEL}. Pas de deck. Pas de pitch. Trois points, puis on décide si le pilote a du sens.`
                : `${CAL_MEETING_DURATION_LABEL}. No deck. No pitch. Three things, then we decide if a pilot makes sense.`}
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{delay:0.1}} className="flex flex-col gap-5">
            {agenda.map((item,i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-cta">
                  {item.n}
                </div>
                <Card hover className="flex-1">
                  <h3 className="font-semibold text-ink mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.body}</p>
                </Card>
              </div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} transition={{delay:0.2}} className="mt-10 bg-navy-dark rounded-xl3 p-6 text-white text-center">
            <p className="text-white/60 text-sm mb-4">After the call, one of three things happens:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { Icon: Rocket,    label:'Fit confirmed', desc:'We agree on the pilot and you send your list within 24 hours.' },
                { Icon: HelpCircle, label:'Needs more info', desc:'We ask follow-up questions and schedule a second 10-minute check-in.' },
                { Icon: Hand,      label:'Not a fit', desc:'We say so directly. No pressure, no follow-up emails. Your time is respected.' },
              ].map((o,i) => (
                <div key={i} className="text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-3">
                    <o.Icon className="w-5 h-5 text-gold" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold text-white mb-1">{o.label}</p>
                  <p className="text-[0.72rem] text-white/40 leading-snug">{o.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </ContainerSm>
      </Section>

      <Divider />

      {/* What you will learn */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>What you will leave with</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Even if we are not a fit, <em className="italic text-gold">the call is worth it.</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { Icon: Search,   title:'Signal clarity on your ICP', body:'We identify what public signals exist for your target market and which ones tend to generate the strongest openers.' },
              { Icon: PenLine,  title:'One live example', body:'We write or show an example opener for a real prospect in your niche during the call. You see what the research actually looks like.' },
              { Icon: BarChart2, title:'Honest baseline assessment', body:'We tell you whether your current reply rate problem is an opener problem, an ICP problem, or an offer problem. Only the opener problem is one we solve.' },
            ].map((item,i) => (
              <motion.div key={i} variants={staggerItem} className="h-full">
                <Card hover className="h-full">
                  <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4">
                    <item.Icon className="w-5 h-5 text-navy" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-ink mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.body}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* FAQ */}
      <Section>
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>{isFr ? 'Questions sur le call' : 'Questions about the call'}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {isFr ? 'Réponses ' : 'Quick '}
              <em className="italic text-gold">{isFr ? 'rapides.' : 'answers.'}</em>
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="divide-y divide-border">
            {faqs.map((faq,i) => {
              const isOpen = openFaq === i
              return (
              <div key={i}>
                <button onClick={()=>setOpenFaq(isOpen?null:i)}
                  aria-expanded={isOpen}
                  aria-controls={`bookcall-faq-${i}`}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors group">
                  <span>{faq.q}</span>
                  <span aria-hidden="true" className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen?'bg-navy text-white border-navy rotate-45':'border-border-2 text-muted'}`}>+</span>
                </button>
                <div id={`bookcall-faq-${i}`} role="region" className={`faq-body ${isOpen?'open':''}`}>
                  <div><p className="pb-4 text-sm text-muted leading-relaxed pr-10">{faq.a}</p></div>
                </div>
              </div>
              )
            })}
          </motion.div>
        </ContainerSm>
      </Section>

      <ServiceFacts titleKey="serviceFacts.title.bookCall" className="bg-cream-2 py-12 sm:py-16" />

      {/* Final CTA */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>Book the call</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-4">
              {CAL_MEETING_DURATION_LABEL}. <em className="italic text-gold">We decide together.</em>
            </h2>
            <p className="text-white/50 max-w-sm mx-auto mb-8 leading-relaxed">
              No pitch. No deck. A direct conversation about your ICP and whether Dossier can beat your current baseline.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={calBookingUrl('zoom')} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-navy font-bold text-base pl-6 pr-2.5 py-3 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:bg-cream hover:shadow-[0_6px_28px_rgba(255,255,255,0.2)] active:scale-[0.97] transition-all duration-200 group">
                Book a {CAL_MEETING_DURATION_LABEL} Fit Call
                <span className="w-10 h-10 rounded-full bg-navy/[0.08] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110 transition-all duration-300">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </a>
              <BtnPrimary to="/free-lines">Or claim 100 free lines first</BtnPrimary>
            </div>
            <p className="text-white/25 text-xs mt-5">No commitment · No credit card · Zoom or Teams · {CAL_MEETING_DURATION_LABEL}</p>
            <div className="mt-8 flex justify-center">
              <ContactBlock className="text-left text-white/60 [&_a]:text-white/90" showLocation={false} />
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
