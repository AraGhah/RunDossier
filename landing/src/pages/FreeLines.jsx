import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Search, BarChart2, FileSpreadsheet, Clock, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Section, Container, Eyebrow, BtnPrimary, Card, Divider, ContainerSm,
  fadeUp, staggerContainer, staggerItem, OpenerCard,
} from '../components/ui'
import { submitPilotRequest } from '../lib/api'
import ServiceFacts from '../components/ServiceFacts'
import PageH1 from '../components/PageH1'
import { getPageH1 } from '../lib/page-headings'
import { useTranslation } from '../context/LanguageContext'
import { getFreeLinesContent, validateFreeLinesForm } from '../i18n/free-lines-data'

const INCLUDED_ICONS = [PenLine, Search, BarChart2, FileSpreadsheet, Clock, Shield]

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
  const { lang } = useTranslation()
  const c = getFreeLinesContent(lang)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [touched, setTouched]           = useState({})
  const [fieldErrors, setFieldErrors]   = useState({})
  const [submitAttempted, setSubmit]    = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [serverError, setServerError]   = useState('')
  const [openFaq, setOpenFaq]           = useState(null)
  const h1 = getPageH1('/free-lines', lang)
  const successRef = useRef(null)
  const firstErrorRef = useRef(null)

  const currentErrors = validateFreeLinesForm(form, c.validation)
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
      const subject = c.form.mailtoSubject(form.company)
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
      setServerError(err.message || c.form.serverError)
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
                {c.hero.badge}
              </div>
              <PageH1 className="mb-5">{h1}</PageH1>
              <p className="text-muted text-lg leading-relaxed mb-8">
                {c.hero.intro}
              </p>
              <ul className="flex flex-col gap-3 text-sm" aria-label={c.hero.bulletsAria}>
                {c.hero.bullets.map((item, i) => (
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
                  <h2 className="font-display text-2xl font-bold text-white mb-3">{c.success.title}</h2>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {c.success.body}
                  </p>
                </div>
              ) : (
                <div className="bg-black/[0.025] border border-black/[0.05] p-1.5 rounded-xl4">
                  <div className="bg-white rounded-[calc(2rem-5px)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <h2 className="font-display text-xl font-semibold text-ink mb-1">{c.form.title}</h2>
                    <p className="text-sm text-muted mb-6">{c.form.subtitle}</p>

                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      aria-label={c.form.ariaLabel}
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
                          {c.form.fields.name} <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-name"
                          type="text"
                          name="name"
                          placeholder={c.form.placeholders.name}
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
                          {c.form.fields.email} <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-email"
                          type="email"
                          name="email"
                          placeholder={c.form.placeholders.email}
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
                          {c.form.fields.company} <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-company"
                          type="text"
                          name="company"
                          placeholder={c.form.placeholders.company}
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
                          {c.form.fields.url} <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <input
                          id="fl-url"
                          type="url"
                          name="url"
                          placeholder={c.form.placeholders.url}
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
                          {c.form.fields.sequencer} <span className="ml-1 font-normal normal-case tracking-normal text-muted-2">{c.form.fields.sequencerOptional}</span>
                        </label>
                        <input
                          id="fl-sequencer"
                          type="text"
                          name="sequencer"
                          placeholder={c.form.placeholders.sequencer}
                          value={form.sequencer}
                          onChange={e => handleChange('sequencer', e.target.value)}
                          className={inputCls('sequencer')}
                        />
                      </div>

                      {/* Message / ICP details — required */}
                      <div>
                        <label htmlFor="fl-message" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          {c.form.fields.message} <span aria-hidden="true" className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="fl-message"
                          name="message"
                          placeholder={c.form.placeholders.message}
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
                            {c.form.submitting}
                          </>
                        ) : (
                          c.form.submit
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
                            {c.form.validationSummary}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <p className="text-center text-xs text-muted-2">
                        {c.form.footer}
                      </p>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </Container>
      </Section>

      <ServiceFacts titleKey="serviceFacts.title.freeLines" className="bg-cream-2 py-12 sm:py-16" />

      <Divider />
      <Section>
        <Container>
          <motion.div {...fadeUp} className="text-center mb-12">
            <Eyebrow>{c.included.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.included.title}<em className="italic text-gold">{c.included.titleEm}</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once:true, margin:'-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {c.included.items.map((item, i) => {
              const Icon = INCLUDED_ICONS[i]
              return (
              <motion.div key={i} variants={staggerItem}>
                <Card hover>
                  <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-navy" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-ink mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.body}</p>
                </Card>
              </motion.div>
            )})}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* ── CSV PREVIEW ─────────────────────────────────────────────────── */}
      <Section className="bg-cream-2">
        <Container>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>{c.csv.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.csv.title}<em className="italic text-gold">{c.csv.titleEm}</em>
            </h2>
          </motion.div>

          {/* Mobile: card layout */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="md:hidden flex flex-col gap-4">
            {c.csvRows.map((row, i) => {
              const confLabel = c.confLabels[row.confKey]
              const confHigh = row.confKey === 'high'
              return (
              <div key={i} className="bg-white border border-border rounded-xl2 p-4 sm:p-5 shadow-card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.n}</p>
                    <p className="text-sm text-muted">{row.co}</p>
                  </div>
                  <span className={`text-[0.68rem] font-bold px-2 py-1 rounded-full flex-shrink-0 ${confHigh?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{confLabel}</span>
                </div>
                <p className="text-[0.72rem] text-muted mb-3"><span className="font-semibold text-ink-2">{c.csv.signal}</span> {row.signal}</p>
                <p className="text-[0.78rem] italic text-ink leading-snug mb-2"><span className="not-italic font-semibold text-[0.65rem] uppercase tracking-wider text-muted block mb-1">{c.csv.openerA}</span>{row.a}</p>
                <p className="text-[0.78rem] italic text-ink leading-snug mb-3"><span className="not-italic font-semibold text-[0.65rem] uppercase tracking-wider text-muted block mb-1">{c.csv.openerB}</span>{row.b}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{c.csv.qaScore}</span>
                  <div className="flex gap-0.5" aria-label={`${c.csv.qaScore} ${row.qa}`}>
                    {[1,2,3,4,5].map(d => <span key={d} className={`w-1.5 h-1.5 rounded-full ${d<=parseInt(row.qa)?'bg-gold':'bg-border-2'}`} />)}
                  </div>
                </div>
              </div>
            )})}
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
                      {c.csv.headers.map((h, i, a) => (
                        <th key={h} scope="col" className={`bg-cream-2 text-left text-muted-2 font-semibold text-[0.65rem] uppercase tracking-wider px-4 py-2.5 border-b border-border whitespace-nowrap ${i===a.length-1?'rounded-tr-[calc(1.5rem-5px)]':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.csvRows.map((row, i) => {
                      const confLabel = c.confLabels[row.confKey]
                      const confHigh = row.confKey === 'high'
                      return (
                      <tr key={i} className={`border-t border-border ${i%2===1?'bg-cream/50':''}`}>
                        <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{row.n}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{row.co}</td>
                        <td className="px-4 py-3 text-muted text-[0.75rem] max-w-[120px]">{row.signal}</td>
                        <td className="px-4 py-3 italic text-ink max-w-[200px] text-[0.78rem] leading-snug">{row.a}</td>
                        <td className="px-4 py-3 italic text-ink max-w-[200px] text-[0.78rem] leading-snug">{row.b}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-0.5 justify-center" aria-label={`${c.csv.qaScore} ${row.qa}`}>
                            {[1,2,3,4,5].map(d => <span key={d} className={`w-1.5 h-1.5 rounded-full ${d<=parseInt(row.qa)?'bg-gold':'bg-border-2'}`} />)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-[0.68rem] font-bold px-2 py-1 rounded-full ${confHigh?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{confLabel}</span>
                        </td>
                      </tr>
                    )})}
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
            <Eyebrow>{c.examples.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.examples.title}<em className="italic text-gold">{c.examples.titleEm}</em>
            </h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once:true, margin:'-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.examples.items.map((o, i) => <OpenerCard key={i} {...o} />)}
          </motion.div>
        </Container>
      </Section>

      <Divider />

      {/* FAQ */}
      <Section>
        <ContainerSm>
          <motion.div {...fadeUp} className="text-center mb-10">
            <Eyebrow>{c.faq.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-tight">
              {c.faq.title}
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="divide-y divide-border">
            {c.faq.items.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`freelines-faq-${i}`}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-[0.97rem] hover:text-navy transition-colors group"
                  >
                    <span>{faq.q}</span>
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-navy text-white border-navy rotate-45' : 'border-border-2 text-muted'}`}
                    >
                      +
                    </span>
                  </button>
                  <div id={`freelines-faq-${i}`} role="region" className={`faq-body ${isOpen ? 'open' : ''}`}>
                    <div>
                      <p className="pb-4 text-sm text-muted leading-relaxed pr-10">{faq.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </ContainerSm>
      </Section>

      <Divider />

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <Section className="bg-navy-dark">
        <Container>
          <motion.div {...fadeUp} className="text-center">
            <Eyebrow light>{c.cta.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] text-white mb-6">
              {c.cta.title}<em className="italic text-gold">{c.cta.titleEm}</em>
            </h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {c.cta.bullets.map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                  <svg className="text-gold" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <BtnPrimary to="/free-lines" large>{c.cta.button}</BtnPrimary>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
