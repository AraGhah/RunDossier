import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Search, BarChart2, FileSpreadsheet, Clock, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Section, Container, Eyebrow, BtnPrimary, Card, Divider,
  fadeUp, staggerContainer, staggerItem, OpenerCard,
} from '../components/ui'
import { submitPilotRequest } from '../lib/api'

// ── STATIC DATA ───────────────────────────────────────────────────────────────

const included = [
  { Icon: PenLine,         title:'3 opener variants per prospect',   body:'Each lead gets three QA-scored first lines, each with a different angle and framing. You pick the one that fits your campaign.' },
  { Icon: Search,          title:'Research signal included',          body:'Every opener comes with the source signal used: the LinkedIn article, product launch, pricing change, or public content that grounded the line.' },
  { Icon: BarChart2,       title:'Confidence score and reasoning',    body:'Each opener is rated on a 1 to 5 scale with a short note on why we scored it that way. Low-confidence leads are flagged, not shipped.' },
  { Icon: FileSpreadsheet, title:'Ready-to-import CSV',               body:'The deliverable lands in your inbox as a formatted CSV. Load it into Smartlead, Instantly, Lemlist, EmailBison, or any sequencer that accepts CSV imports.' },
  { Icon: Clock,           title:'Delivered in 24 to 48 hours',       body:'Most pilot batches are delivered within one business day. Complex ICPs may take 48 hours if the research depth requires it.' },
  { Icon: Shield,          title:'No campaign access needed',         body:'We never ask for your inboxes, your sequencer login, or your campaign settings. You keep full control of everything except the opener itself.' },
]

const sampleOpeners = [
  { quote: 'Your breakdown of why cold email collapsed between 2023 and 2025 is the most precise articulation of the problem I\'ve seen published. GPT filler is exactly the right framing.', role: 'Founder, Outbound Consultancy', signal: 'LinkedIn article, Q3 2024', qa: 4 },
  { quote: 'Saw you shipped a new leads product in February and positioned it around removing the friction that every other tool buries in five-step workflows. Smart wedge for where the market is heading.', role: 'Co-Founder, Outbound SaaS', signal: 'ProductHunt launch review', qa: 5 },
  { quote: 'Most founders bury their best result in a case study nobody reads. You put it in your headline — smart move, and probably why your inbound is converting above what your size would suggest.', role: 'Founder, B2B Lead Gen Agency', signal: 'Website hero copy analysis', qa: 4 },
]

const csvRows = [
  { n:'J. Whitmore', co:'LeadFlow Inc.', signal:'LinkedIn article on cold email decay', a:'Your breakdown of why cold email collapsed 2023 to 2025 is the most precise articulation I\'ve seen...', b:'The part about confusing volume with signal is something most agencies still haven\'t admitted...', qa:'4/5', conf:'High' },
  { n:'M. Okafor', co:'Apex Outbound', signal:'ProductHunt launch, Feb 2025', a:'Saw you launched in February and positioned around removing friction everyone else buries in 5-step flows...', b:'Your PH launch framing — one CSV in, one campaign out — is the clearest positioning in leads tooling this year...', qa:'5/5', conf:'High' },
  { n:'R. Castillo', co:'Clearpath B2B', signal:'Twitter thread, 2.4k engagements', a:'Your thread on why SDR handoffs break under 50 people is something I\'ve seen play out at 3 agencies...', b:'The nuance about handoffs breaking before the CRM even exists usually gets lost when people write about this...', qa:'3/5', conf:'Medium' },
]

// ── VALIDATION ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const URL_RE   = /^(https?:\/\/)|(www\.)|(linkedin\.com)/i

function validate(form) {
  const e = {}

  if (!form.name.trim())
    e.name = 'Full name is required.'

  if (!form.email.trim())
    e.email = 'Work email is required.'
  else if (!EMAIL_RE.test(form.email.trim()))
    e.email = 'Enter a valid business email address.'

  if (!form.company.trim())
    e.company = 'Company name is required.'

  if (!form.url.trim())
    e.url = 'LinkedIn profile or website URL is required.'
  else if (!URL_RE.test(form.url.trim()))
    e.url = 'Enter a full URL (https://…) or a LinkedIn profile link.'

  if (!form.message.trim())
    e.message = 'Please describe your ICP and current outbound setup.'
  else if (form.message.trim().length < 20)
    e.message = 'Please provide a bit more detail (at least 20 characters).'

  return e
}

// ── FIELD ERROR COMPONENT ─────────────────────────────────────────────────────

function FieldError({ id, message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-1.5 mt-1.5 text-[0.72rem] font-medium text-red-600"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

// ── FORM ──────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', email: '', company: '', sequencer: '', url: '', message: '', website: '' }

export default function FreeLines() {
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [touched, setTouched]           = useState({})
  const [fieldErrors, setFieldErrors]   = useState({})
  const [submitAttempted, setSubmit]    = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [serverError, setServerError]   = useState('')
  const successRef = useRef(null)
  const firstErrorRef = useRef(null)

  // Recompute errors on every form change
  const currentErrors = validate(form)
  const isValid = Object.keys(currentErrors).length === 0

  // Visible error for a field: only shown after the field was touched or submit was attempted
  const visibleError = useCallback(
    (key) => ((touched[key] || submitAttempted) ? currentErrors[key] : undefined),
    [touched, submitAttempted, currentErrors]
  )

  useEffect(() => {
    if (submitted && successRef.current) successRef.current.focus()
  }, [submitted])

  const handleChange = (key, value) => {
    setForm(p => ({ ...p, [key]: value }))
    // Clear server error on any change
    if (serverError) setServerError('')
  }

  const handleBlur = (key) => {
    setTouched(p => ({ ...p, [key]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmit(true)

    // Client-side guard — never send if validation fails
    if (!isValid) {
      // Move focus to the first error field for accessibility
      setTimeout(() => {
        const firstInvalid = document.querySelector('[aria-invalid="true"]')
        if (firstInvalid) firstInvalid.focus()
      }, 50)
      return
    }

    // Honeypot guard
    if (form.website.trim()) return

    setServerError('')
    setSubmitting(true)

    // When no backend is configured, fall back to mailto so the form always works
    if (!import.meta.env.VITE_API_URL) {
      const subject = `Pilot Request — ${form.company}`
      const body = [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Company: ${form.company}`,
        form.sequencer ? `Sequencer: ${form.sequencer}` : '',
        `LinkedIn/Website: ${form.url}`,
        `\nMessage:\n${form.message}`,
      ].filter(Boolean).join('\n')
      window.open(`mailto:ara@getdossier.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      setSubmitting(false)
      setSubmitted(true)
      return
    }

    try {
      await submitPilotRequest({ ...form })
      setSubmitted(true)
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Shared input className builder
  const inputCls = (key) => {
    const hasError = !!visibleError(key)
    return [
      'w-full px-4 py-3 rounded-xl border text-ink text-sm bg-cream',
      'placeholder-muted-2 focus:outline-none focus:ring-2 focus:bg-white',
      'transition-colors duration-200',
      hasError
        ? 'border-red-400 bg-red-50/40 focus:ring-red-200 focus:border-red-400'
        : 'border-border focus:ring-navy/20 focus:border-navy/40',
    ].join(' ')
  }

  return (
    <>
      {/* ── HERO + FORM ─────────────────────────────────────────────────── */}
      <Section className="pt-24 sm:pt-32 pb-0 overflow-hidden" id="pilot-form">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold/[0.07] to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: benefits */}
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-2 text-[0.8rem] font-semibold text-gold mb-6">
                <span className="w-[5px] h-[5px] rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                Limited pilot spots available
              </div>
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.1] tracking-tight mb-5">
                100 personalized openers. <em className="italic text-gold">Completely free.</em>
              </h1>
              <p className="text-muted text-lg leading-relaxed mb-8">
                Send us your prospect list. We research each lead, write three QA-scored first lines, and return a ready-to-import CSV within 48 hours. No credit card. No campaign access. No commitment.
              </p>
              <ul className="flex flex-col gap-3 text-sm" aria-label="What is included">
                {[
                  'Three QA-scored openers per prospect',
                  'Research signal and confidence score included',
                  'Delivered as CSV in 24 to 48 hours',
                  'Works with Smartlead, Instantly, Lemlist, and more',
                  'No inboxes, no credentials, no campaign access',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className="text-gold flex-shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8L6.5 11.5L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-ink-2">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: Form */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              {submitted ? (
                <div
                  ref={successRef}
                  tabIndex={-1}
                  role="status"
                  aria-live="polite"
                  className="bg-navy-dark rounded-xl4 p-10 text-center outline-none"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
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

                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      aria-label="Pilot request form"
                      className="flex flex-col gap-4"
                    >
                      {/* Honeypot — invisible to real users */}
                      <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true">
                        <label htmlFor="fl-website">Website</label>
                        <input
                          id="fl-website"
                          type="text"
                          name="website"
                          autoComplete="off"
                          tabIndex={-1}
                          value={form.website}
                          onChange={e => handleChange('website', e.target.value)}
                        />
                      </div>

                      {/* Full name */}
                      <div>
                        <label htmlFor="fl-name" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Full name <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-name"
                          type="text"
                          name="name"
                          placeholder="Sarah Chen"
                          autoComplete="name"
                          required
                          aria-required="true"
                          aria-invalid={!!visibleError('name')}
                          aria-describedby={visibleError('name') ? 'err-name' : undefined}
                          value={form.name}
                          onChange={e => handleChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          className={inputCls('name')}
                        />
                        <FieldError id="err-name" message={visibleError('name')} />
                      </div>

                      {/* Work email */}
                      <div>
                        <label htmlFor="fl-email" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Work email <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-email"
                          type="email"
                          name="email"
                          placeholder="sarah@youragency.com"
                          autoComplete="email"
                          required
                          aria-required="true"
                          aria-invalid={!!visibleError('email')}
                          aria-describedby={visibleError('email') ? 'err-email' : undefined}
                          value={form.email}
                          onChange={e => handleChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className={inputCls('email')}
                        />
                        <FieldError id="err-email" message={visibleError('email')} />
                      </div>

                      {/* Company name */}
                      <div>
                        <label htmlFor="fl-company" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Company name <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-company"
                          type="text"
                          name="company"
                          placeholder="Apex Outbound"
                          required
                          aria-required="true"
                          aria-invalid={!!visibleError('company')}
                          aria-describedby={visibleError('company') ? 'err-company' : undefined}
                          value={form.company}
                          onChange={e => handleChange('company', e.target.value)}
                          onBlur={() => handleBlur('company')}
                          className={inputCls('company')}
                        />
                        <FieldError id="err-company" message={visibleError('company')} />
                      </div>

                      {/* LinkedIn or website — now required */}
                      <div>
                        <label htmlFor="fl-url" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          LinkedIn or website <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-url"
                          type="url"
                          name="url"
                          placeholder="https://linkedin.com/in/yourprofile"
                          required
                          aria-required="true"
                          aria-invalid={!!visibleError('url')}
                          aria-describedby={visibleError('url') ? 'err-url' : undefined}
                          value={form.url}
                          onChange={e => handleChange('url', e.target.value)}
                          onBlur={() => handleBlur('url')}
                          className={inputCls('url')}
                        />
                        <FieldError id="err-url" message={visibleError('url')} />
                      </div>

                      {/* Current sequencer — optional */}
                      <div>
                        <label htmlFor="fl-sequencer" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Current sequencer <span className="ml-1 font-normal normal-case tracking-normal text-muted-2">(optional)</span>
                        </label>
                        <input
                          id="fl-sequencer"
                          type="text"
                          name="sequencer"
                          placeholder="Smartlead, Instantly, Lemlist…"
                          value={form.sequencer}
                          onChange={e => handleChange('sequencer', e.target.value)}
                          className={inputCls('sequencer')}
                        />
                      </div>

                      {/* Message / ICP details — required */}
                      <div>
                        <label htmlFor="fl-message" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Your ICP and current outbound setup <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="fl-message"
                          name="message"
                          placeholder="Who do you target, what sequencer do you use, and what reply rate are you currently getting?"
                          rows={3}
                          required
                          aria-required="true"
                          aria-invalid={!!visibleError('message')}
                          aria-describedby={visibleError('message') ? 'err-message' : undefined}
                          value={form.message}
                          onChange={e => handleChange('message', e.target.value)}
                          onBlur={() => handleBlur('message')}
                          className={`${inputCls('message')} resize-none leading-relaxed`}
                        />
                        <FieldError id="err-message" message={visibleError('message')} />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={submitting}
                        aria-disabled={submitting}
                        className="w-full bg-navy text-white font-semibold text-[0.95rem] py-3.5 rounded-full
                          shadow-cta hover:bg-navy-2 hover:shadow-cta-hover active:scale-[0.98]
                          transition-all duration-200 mt-1 disabled:opacity-60 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Sending…
                          </>
                        ) : (
                          'Claim 100 Free Lines →'
                        )}
                      </button>

                      {/* Server error */}
                      <AnimatePresence>
                        {serverError && (
                          <motion.div
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
                          >
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{serverError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Summary validation error shown on submit attempt */}
                      <AnimatePresence>
                        {submitAttempted && !isValid && (
                          <motion.p
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center text-xs text-red-600 font-medium"
                          >
                            Please fill in all required fields above before submitting.
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <p className="text-center text-xs text-muted-2">
                        No credit card · No campaign access · No commitment
                      </p>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </Container>
      </Section>

      <Divider />

      {/* ── WHAT IS INCLUDED ────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>What you get</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              Exactly what lands <em className="italic text-gold">in your inbox.</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once:true, margin:'-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {included.map((item, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
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

      {/* ── CSV PREVIEW ─────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>The deliverable</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What the CSV actually <em className="italic text-gold">looks like.</em>
            </h2>
          </motion.div>

          {/* Mobile: card layout */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="md:hidden flex flex-col gap-4">
            {csvRows.map((row, i) => (
              <div key={i} className="bg-white border border-border rounded-xl2 p-4 sm:p-5 shadow-card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.n}</p>
                    <p className="text-sm text-muted">{row.co}</p>
                  </div>
                  <span className={`text-[0.68rem] font-bold px-2 py-1 rounded-full flex-shrink-0 ${row.conf==='High'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{row.conf}</span>
                </div>
                <p className="text-[0.72rem] text-muted mb-3"><span className="font-semibold text-ink-2">Signal:</span> {row.signal}</p>
                <p className="text-[0.78rem] italic text-ink leading-snug mb-2"><span className="not-italic font-semibold text-[0.65rem] uppercase tracking-wider text-muted block mb-1">Opener A</span>{row.a}</p>
                <p className="text-[0.78rem] italic text-ink leading-snug mb-3"><span className="not-italic font-semibold text-[0.65rem] uppercase tracking-wider text-muted block mb-1">Opener B</span>{row.b}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted">QA score</span>
                  <div className="flex gap-0.5" aria-label={`QA score ${row.qa}`}>
                    {[1,2,3,4,5].map(d => <span key={d} className={`w-1.5 h-1.5 rounded-full ${d<=parseInt(row.qa)?'bg-gold':'bg-border-2'}`} />)}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Desktop: table */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="hidden md:block overflow-x-auto">
            <div className="bg-black/[0.025] border border-black/[0.05] rounded-xl3 p-1.5 min-w-[640px]">
              <div className="bg-white rounded-[calc(1.5rem-5px)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="bg-navy px-5 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    {[0,1,2].map(d => <div key={d} className="w-2.5 h-2.5 rounded-full bg-white/20" />)}
                  </div>
                  <span className="text-white/40 text-xs font-mono">dossier_batch_001.csv</span>
                </div>
                <table className="w-full text-[0.8rem]">
                  <thead>
                    <tr>
                      {['Prospect','Company','Signal Used','Opener A','Opener B','QA Score','Confidence'].map((h, i, a) => (
                        <th key={h} scope="col" className={`bg-cream-2 text-left text-muted-2 font-semibold text-[0.65rem] uppercase tracking-wider px-4 py-2.5 border-b border-border whitespace-nowrap ${i===a.length-1?'rounded-tr-[calc(1.5rem-5px)]':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${i%2===1?'bg-cream/50':''}`}>
                        <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{row.n}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{row.co}</td>
                        <td className="px-4 py-3 text-muted text-[0.75rem] max-w-[120px]">{row.signal}</td>
                        <td className="px-4 py-3 italic text-ink max-w-[200px] text-[0.78rem] leading-snug">{row.a}</td>
                        <td className="px-4 py-3 italic text-ink max-w-[200px] text-[0.78rem] leading-snug">{row.b}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-0.5 justify-center" aria-label={`QA score ${row.qa}`}>
                            {[1,2,3,4,5].map(d => <span key={d} className={`w-1.5 h-1.5 rounded-full ${d<=parseInt(row.qa)?'bg-gold':'bg-border-2'}`} />)}
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

      {/* ── SAMPLE OPENERS ──────────────────────────────────────────────── */}
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>Examples</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              What you will receive <em className="italic text-gold">for your prospects.</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once:true, margin:'-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleOpeners.map((o, i) => <OpenerCard key={i} {...o} />)}
          </motion.div>
        </Container>
      </Section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>No risk. No commitment.</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-6">
              Claim your 100 free lines <em className="italic text-gold">today.</em>
            </h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {['No credit card required','No campaign access','No minimum commitment','Results in 24 to 48 hours'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                  <svg className="text-gold" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <BtnPrimary to="/free-lines" large>Claim 100 Free Lines</BtnPrimary>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
