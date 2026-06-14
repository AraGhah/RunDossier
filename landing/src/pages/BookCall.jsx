import { useState } from 'react'
import { motion } from 'framer-motion'
import { Section, Container, ContainerSm, Eyebrow, BtnPrimary, Card, Divider, fadeUp, staggerContainer, staggerItem } from '../components/ui'

const agenda = [
  { n:'01', title:'Understand your ICP and current results', body:'We ask about your target market, your current sequencer, your average reply rate, and what you have already tried. Five minutes.' },
  { n:'02', title:'Walk through a live example from your niche', body:'We pull up a sample prospect from your ICP and show you what a real Dossier opener would look like for them. You see the research process, not just the output.' },
  { n:'03', title:'Confirm whether the pilot makes sense', body:'If Dossier is not a fit for your use case, we say so directly and save everyone time. If it is a fit, we agree on the next step: starting your free 100-prospect pilot.' },
]

const forWho = [
  { icon:'🏢', label:'Cold email agencies', desc:'Managing campaigns for multiple clients and needing to scale personalization across ICPs.' },
  { icon:'👤', label:'B2B founders doing outbound', desc:'Running your own cold email and wanting to improve reply rates before hiring an SDR team.' },
  { icon:'📋', label:'SDR teams', desc:'Sending 500 or more emails per week where reply rate is the metric that determines headcount.' },
  { icon:'📈', label:'Lead gen operators', desc:'Running high-volume campaigns where generic openers have already stopped working.' },
]

const faqs = [
  { q:'Is this a sales call?', a:'It is a fit assessment. We ask about your current results and your ICP, show you a live example from your niche, and confirm whether the pilot makes sense for you. If Dossier is not a fit, we say so.' },
  { q:'What do I need to prepare?', a:'Nothing formal. It helps to have a rough idea of your current reply rate and a sense of who you are targeting. We will do the rest.' },
  { q:'What happens after the call?', a:'If we agree the pilot makes sense, you send us your prospect list within 24 hours and we deliver the first 100 openers within 48 hours of receiving it.' },
  { q:'What if I cannot attend the scheduled time?', a:'You can reschedule anytime through the Cal.com booking page. There is no penalty for rescheduling.' },
  { q:'Is the 100 free lines offer still available after the call?', a:'Yes. The pilot offer is available whether or not you book a call first. The call just helps us understand your ICP so the pilot batch is better calibrated.' },
]

export default function BookCall() {
  const [openFaq, setOpenFaq] = useState(null)

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
              <Eyebrow>Book a 15-minute call</Eyebrow>
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.1] tracking-tight mb-5">
                15 minutes to find out if Dossier is <em className="italic text-gold">the right fit.</em>
              </h1>
              <p className="text-muted text-lg leading-relaxed mb-8">
                We confirm your ICP, show you a live example from your niche, and agree on a pilot plan. No pitch deck. No pressure. Just a direct conversation about whether this works for your campaign.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                {[
                  '15 minutes via video or phone',
                  'Live example from your specific niche',
                  'Direct fit assessment, no fluff',
                  'Pilot plan agreed by end of call if there is a fit',
                  'No commitment to move forward',
                ].map((item,i) => (
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
                <div className="bg-white rounded-[calc(2rem-5px)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] min-h-[460px] flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-display text-lg font-semibold text-ink">Book a 15-min Fit Call</h2>
                      <p className="text-xs text-muted mt-0.5">Dossier by Preframe · Video or Phone</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="3" width="12" height="11" rx="2" stroke="white" strokeWidth="1.2"/>
                        <path d="M5 2v2M11 2v2M2 7h12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-muted mb-5">Select a time that works for you:</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {['Mon 9:00 AM','Mon 10:30 AM','Mon 2:00 PM','Tue 9:00 AM','Tue 11:00 AM','Tue 3:00 PM'].map((slot,i) => (
                      <button key={i}
                        className="py-2.5 px-3 rounded-lg border border-border text-xs font-medium text-ink hover:border-navy hover:bg-navy/5 hover:text-navy transition-all duration-200 text-left">
                        {slot}
                      </button>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <a href="https://cal.com/getdossier/pilot" target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-navy text-white font-semibold text-[0.92rem] py-3.5 rounded-full shadow-cta hover:bg-navy-2 hover:shadow-cta-hover transition-all duration-200 active:scale-[0.98]">
                      View All Available Times
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <p className="text-center text-xs text-muted-2 mt-3">Powered by Cal.com · No spam, ever</p>
                  </div>
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
            <Eyebrow>Who this call is for</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              The call makes sense if you are <em className="italic text-gold">one of these.</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {forWho.map((item,i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <span className="text-2xl block mb-3">{item.icon}</span>
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
            <Eyebrow>What we cover</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Exactly what happens <em className="italic text-gold">during the call.</em>
            </h2>
            <p className="mt-3 text-muted max-w-lg mx-auto">
              15 minutes. No deck. No pitch. Three things, then we decide if a pilot makes sense.
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
            <p className="text-white/60 text-sm mb-4">After the 15 minutes, one of three things happens:</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { emoji:'🚀', label:'Fit confirmed', desc:'We agree on the pilot and you send your list within 24 hours.' },
                { emoji:'🤔', label:'Needs more info', desc:'We ask follow-up questions and schedule a second 10-minute check-in.' },
                { emoji:'👋', label:'Not a fit', desc:'We say so directly. No pressure, no follow-up emails. Your time is respected.' },
              ].map((o,i) => (
                <div key={i} className="text-center">
                  <span className="text-2xl block mb-2">{o.emoji}</span>
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
              { icon:'🔍', title:'Signal clarity on your ICP', body:'We identify what public signals exist for your target market and which ones tend to generate the strongest openers.' },
              { icon:'✍️', title:'One live example', body:'We write or show an example opener for a real prospect in your niche during the call. You see what the research actually looks like.' },
              { icon:'📊', title:'Honest baseline assessment', body:'We tell you whether your current reply rate problem is an opener problem, an ICP problem, or an offer problem. Only the opener problem is one we solve.' },
            ].map((item,i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <span className="text-2xl block mb-3">{item.icon}</span>
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
            <Eyebrow>Questions about the call</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Quick <em className="italic text-gold">answers.</em>
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="divide-y divide-border">
            {faqs.map((faq,i) => (
              <div key={i}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
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

      {/* Final CTA */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>Book the call</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-4">
              15 minutes. <em className="italic text-gold">We decide together.</em>
            </h2>
            <p className="text-white/50 max-w-sm mx-auto mb-8 leading-relaxed">
              No pitch. No deck. A direct conversation about your ICP and whether Dossier can beat your current baseline.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://cal.com/getdossier/pilot" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-navy font-bold text-base pl-6 pr-2.5 py-3 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:bg-cream hover:shadow-[0_6px_28px_rgba(255,255,255,0.2)] active:scale-[0.97] transition-all duration-200 group">
                Book a 15-min Fit Call
                <span className="w-10 h-10 rounded-full bg-navy/[0.08] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110 transition-all duration-300">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </a>
              <BtnPrimary to="/free-lines">Or claim 100 free lines first</BtnPrimary>
            </div>
            <p className="text-white/25 text-xs mt-5">No commitment · No credit card · Results discussed within 15 minutes</p>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
