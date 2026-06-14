import { useState } from 'react'
import { motion } from 'framer-motion'
import { Section, Container, ContainerSm, Eyebrow, BtnPrimary, Card, Divider, fadeUp, staggerContainer, staggerItem, OpenerCard } from '../components/ui'

const included = [
  { icon:'✍️', title:'3 opener variants per prospect', body:'Each lead gets three QA-scored first lines, each with a different angle and framing. You pick the one that fits your campaign.' },
  { icon:'🔍', title:'Research signal included', body:'Every opener comes with the source signal used: the LinkedIn article, product launch, pricing change, or public content that grounded the line.' },
  { icon:'📊', title:'Confidence score and reasoning', body:'Each opener is rated on a 1 to 5 scale with a short note on why we scored it that way. Low-confidence leads are flagged, not shipped.' },
  { icon:'📁', title:'Ready-to-import CSV', body:'The deliverable lands in your inbox as a formatted CSV. Load it into Smartlead, Instantly, Lemlist, EmailBison, or any sequencer that accepts CSV imports.' },
  { icon:'⏱', title:'Delivered in 24 to 48 hours', body:'Most pilot batches are delivered within one business day. Complex ICPs may take 48 hours if the research depth requires it.' },
  { icon:'🔒', title:'No campaign access needed', body:'We never ask for your inboxes, your sequencer login, or your campaign settings. You keep full control of everything except the opener itself.' },
]

const sampleOpeners = [
  { quote: 'Your breakdown of why cold email collapsed between 2023 and 2025 is the most precise articulation of the problem I\'ve seen published. GPT filler is exactly the right framing.', role: 'Founder, Outbound Consultancy', signal: 'LinkedIn article, Q3 2024', qa: 4 },
  { quote: 'Saw you shipped a new leads product in February and positioned it around removing the friction that every other tool buries in five-step workflows. Smart wedge for where the market is heading.', role: 'Co-Founder, Outbound SaaS', signal: 'ProductHunt launch review', qa: 5 },
  { quote: 'Most founders bury their best result in a case study nobody reads. You put it in your headline — smart move, and probably why your inbound is converting above what your size would suggest.', role: 'Founder, B2B Lead Gen Agency', signal: 'Website hero copy analysis', qa: 4 },
]

export default function FreeLines() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', company:'', sequencer:'', url:'' })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    // In production: send to your backend or Cal.com
  }

  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold/[0.07] to-transparent" />
        </div>
        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-2 text-[0.8rem] font-semibold text-gold mb-6">
                <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot" />
                Limited pilot spots available
              </div>
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.1] tracking-tight mb-5">
                100 personalized openers. <em className="italic text-gold">Completely free.</em>
              </h1>
              <p className="text-muted text-lg leading-relaxed mb-8">
                Send us your prospect list. We research each lead, write three QA-scored first lines, and return a ready-to-import CSV within 48 hours. No credit card. No campaign access. No commitment.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                {[
                  'Three QA-scored openers per prospect',
                  'Research signal and confidence score included',
                  'Delivered as CSV in 24 to 48 hours',
                  'Works with Smartlead, Instantly, Lemlist, and more',
                  'No inboxes, no credentials, no campaign access',
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

            {/* Form */}
            <motion.div {...fadeUp} transition={{delay:0.2}}>
              {submitted ? (
                <div className="bg-navy-dark rounded-xl4 p-10 text-center">
                  <span className="text-4xl block mb-4">✅</span>
                  <h2 className="font-display text-2xl font-bold text-white mb-3">You are in.</h2>
                  <p className="text-white/50 text-sm leading-relaxed">
                    We will reach out within 24 hours to confirm your ICP and get your prospect list. Openers land in your inbox within 48 hours of receiving the list.
                  </p>
                </div>
              ) : (
                <div className="bg-black/[0.025] border border-black/[0.05] p-1.5 rounded-xl4">
                  <div className="bg-white rounded-[calc(2rem-5px)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <h2 className="font-display text-xl font-semibold text-ink mb-1">Claim your 100 free lines</h2>
                    <p className="text-sm text-muted mb-6">We confirm fit, get your list, and deliver within 48 hours.</p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      {[
                        { label:'Full name', key:'name', type:'text', placeholder:'Sarah Chen', required:true },
                        { label:'Work email', key:'email', type:'email', placeholder:'sarah@youragency.com', required:true },
                        { label:'Company name', key:'company', type:'text', placeholder:'Apex Outbound', required:true },
                        { label:'Current sequencer', key:'sequencer', type:'text', placeholder:'Smartlead, Instantly, Lemlist...', required:false },
                        { label:'LinkedIn or website (optional)', key:'url', type:'url', placeholder:'https://linkedin.com/in/...', required:false },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">{f.label}{f.required && ' *'}</label>
                          <input
                            type={f.type}
                            placeholder={f.placeholder}
                            required={f.required}
                            value={form[f.key]}
                            onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-cream text-ink text-sm
                              placeholder-muted-2 focus:outline-none focus:border-navy/40 focus:bg-white
                              transition-colors duration-200"
                          />
                        </div>
                      ))}
                      <button type="submit"
                        className="w-full bg-navy text-white font-semibold text-[0.95rem] py-3.5 rounded-full
                          shadow-cta hover:bg-navy-2 hover:shadow-cta-hover active:scale-[0.98]
                          transition-all duration-200 mt-2">
                        Claim 100 Free Lines →
                      </button>
                      <p className="text-center text-xs text-muted-2">No credit card. No campaign access. No commitment.</p>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* What is included */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>What you get</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Exactly what lands <em className="italic text-gold">in your inbox.</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {included.map((item,i) => (
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

      {/* CSV preview */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>The deliverable</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What the CSV actually <em className="italic text-gold">looks like.</em>
            </h2>
          </motion.div>
          <motion.div {...fadeUp} transition={{delay:0.1}} className="overflow-x-auto">
            <div className="bg-black/[0.025] border border-black/[0.05] rounded-xl3 p-1.5 min-w-[640px]">
              <div className="bg-white rounded-[calc(1.5rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="bg-navy px-5 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(d=><div key={d} className="w-2.5 h-2.5 rounded-full bg-white/20" />)}
                  </div>
                  <span className="text-white/40 text-xs font-mono">dossier_batch_001.csv</span>
                </div>
                <table className="w-full text-[0.8rem]">
                  <thead>
                    <tr>
                      {['Prospect','Company','Signal Used','Opener A','Opener B','QA Score','Confidence'].map((h,i,a) => (
                        <th key={h} className={`bg-cream-2 text-left text-muted-2 font-semibold text-[0.65rem] uppercase tracking-wider px-4 py-2.5 border-b border-border whitespace-nowrap ${i===a.length-1?'rounded-tr-[calc(1.5rem-5px)]':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { n:'J. Whitmore', co:'LeadFlow Inc.', signal:'LinkedIn article on cold email decay', a:'Your breakdown of why cold email collapsed 2023 to 2025 is the most precise articulation I\'ve seen...', b:'The part about confusing volume with signal is something most agencies still haven\'t admitted...', qa:'4/5', conf:'High' },
                      { n:'M. Okafor', co:'Apex Outbound', signal:'ProductHunt launch, Feb 2025', a:'Saw you launched in February and positioned around removing friction everyone else buries in 5-step flows...', b:'Your PH launch framing — one CSV in, one campaign out — is the clearest positioning in leads tooling this year...', qa:'5/5', conf:'High' },
                      { n:'R. Castillo', co:'Clearpath B2B', signal:'Twitter thread, 2.4k engagements', a:'Your thread on why SDR handoffs break under 50 people is something I\'ve seen play out at 3 agencies...', b:'The nuance about handoffs breaking before the CRM even exists usually gets lost when people write about this...', qa:'3/5', conf:'Medium' },
                    ].map((row,i) => (
                      <tr key={i} className={`border-t border-border ${i%2===1?'bg-cream/50':''}`}>
                        <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{row.n}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{row.co}</td>
                        <td className="px-4 py-3 text-muted text-[0.75rem] max-w-[120px]">{row.signal}</td>
                        <td className="px-4 py-3 italic text-ink max-w-[200px] text-[0.78rem] leading-snug">{row.a}</td>
                        <td className="px-4 py-3 italic text-ink max-w-[200px] text-[0.78rem] leading-snug">{row.b}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-0.5 justify-center">
                            {[1,2,3,4,5].map(d=><span key={d} className={`w-1.5 h-1.5 rounded-full ${d<=parseInt(row.qa)?'bg-gold':'bg-border-2'}`}/>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-[0.68rem] font-bold px-2 py-1 rounded-full ${row.conf==='High'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{row.conf}</span>
                        </td>
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

      {/* Sample openers */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>Examples</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What you will receive <em className="italic text-gold">for your prospects.</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{once:true,margin:'-60px'}}
            className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleOpeners.map((o,i) => <OpenerCard key={i} {...o} />)}
          </motion.div>
        </Container>
      </Section>

      {/* Trust + urgency */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>No risk. No commitment.</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-6">
              Claim your 100 free lines <em className="italic text-gold">today.</em>
            </h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {['No credit card required','No campaign access','No minimum commitment','Results in 24 to 48 hours'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/60">
                  <svg className="text-gold" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>
            <BtnPrimary href="#top" large>Claim 100 Free Lines</BtnPrimary>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
