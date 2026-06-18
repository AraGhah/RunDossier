import { getTermsContent } from '../i18n/terms-data.js'
import { getPrivacyContent } from '../i18n/privacy-data.js'
import { getTermsFaq, getPrivacyFaq, SITE_URL } from './site-data.js'
import { PAGE_TITLES } from './page-headings.js'
import {
  LEGAL_ENTITY,
  LEGAL_OPERATOR,
  LEGAL_EMAIL,
  LEGAL_WEBSITE,
  LEGAL_LAST_UPDATED,
  LEGAL_JURISDICTION,
  LEGAL_CITY,
  LEGAL_PHONE,
  LEGAL_BUSINESS_HOURS,
  legalPhoneTel,
} from './legal.js'
import { calBookingUrl, CAL_MEETING_DURATION_LABEL, CAL_HOST_NAME } from './cal.js'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderBlock(block) {
  if (block.type === 'h3') {
    return `<h3>${escapeHtml(block.text)}</h3>`
  }
  if (block.type === 'ul') {
    const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')
    return `<ul>\n${items}\n</ul>`
  }
  if (block.type === 'p') {
    if (block.segments) {
      const inner = block.segments
        .map((seg) => {
          if (seg.href) {
            return `<a href="${escapeHtml(seg.href)}">${escapeHtml(seg.text)}</a>`
          }
          if (seg.to) {
            return `<a href="${SITE_URL}${seg.to}">${escapeHtml(seg.text)}</a>`
          }
          if (seg.em) {
            return `<em>${escapeHtml(seg.text)}</em>`
          }
          return escapeHtml(seg.text)
        })
        .join('')
      return `<p>${inner}</p>`
    }
    return `<p>${escapeHtml(block.text)}</p>`
  }
  return ''
}

function renderSections(sections) {
  return sections
    .map(
      (section) => `
      <section aria-labelledby="${escapeHtml(section.title.replace(/\s+/g, '-').toLowerCase())}">
        <h2 id="${escapeHtml(section.title.replace(/\s+/g, '-').toLowerCase())}">${escapeHtml(section.title)}</h2>
        ${section.blocks.map(renderBlock).join('\n')}
      </section>`,
    )
    .join('\n')
}

function renderFaqs(faqs) {
  return faqs
    .map(
      (item) => `
      <article>
        <h3>${escapeHtml(item.q)}</h3>
        <p>${escapeHtml(item.a)}</p>
      </article>`,
    )
    .join('\n')
}

const LEGAL_VARS = {
  entity: LEGAL_ENTITY,
  operator: LEGAL_OPERATOR,
  website: LEGAL_WEBSITE,
  websiteHost: LEGAL_WEBSITE.replace('https://', ''),
  email: LEGAL_EMAIL,
  city: LEGAL_CITY,
  jurisdiction: LEGAL_JURISDICTION,
  bookCallUrl: `${LEGAL_WEBSITE}/book-call`,
  lastUpdated: LEGAL_LAST_UPDATED,
}

export function buildTermsStaticMarkup() {
  const content = getTermsContent('en', LEGAL_VARS)
  const faqs = getTermsFaq('en')
  const h1 = PAGE_TITLES['/terms']

  return `
    <div id="crawl-fallback" class="crawl-fallback">
      <header>
        <p><a href="${SITE_URL}/">Dossier</a> · <a href="${SITE_URL}/privacy">Privacy Policy</a></p>
        <h1>${escapeHtml(h1)}</h1>
        <p><strong>${escapeHtml(content.lastUpdatedLabel)}</strong> ${escapeHtml(LEGAL_LAST_UPDATED)}</p>
        <p>${escapeHtml(content.intro)}</p>
      </header>

      <section aria-labelledby="terms-what">
        <h2 id="terms-what">What are Dossier's Terms of Service?</h2>
        <p>
          Dossier's Terms of Service are the binding agreement between you (or your business) and
          ${escapeHtml(LEGAL_OPERATOR)}, operating ${escapeHtml(LEGAL_ENTITY)} from ${escapeHtml(LEGAL_CITY)},
          Quebec, Canada. They govern use of ${escapeHtml(LEGAL_VARS.websiteHost)}, the 100-prospect free
          pilot, paid plans (Starter $499/mo, Growth $999/mo), CSV deliverables, client compliance duties
          (CASL, PIPEDA, Law 25), billing, cancellation, and liability limits.
        </p>
      </section>

      <section aria-labelledby="terms-top3">
        <h2 id="terms-top3">Top 3 things to know about Dossier Terms</h2>
        <ol>
          <li>
            <h3>You own the opener text after payment</h3>
            <p>Upon full payment, you may use delivered opener copy in your campaigns. Dossier retains ownership of internal QA systems and research methodology.</p>
          </li>
          <li>
            <h3>You remain responsible for outbound compliance</h3>
            <p>Clients must comply with CASL, PIPEDA, Quebec Law 25, CAN-SPAM, GDPR where applicable, and provide prospect data lawfully. Dossier is a research provider, not a campaign sender.</p>
          </li>
          <li>
            <h3>Pilot and billing rules are explicit</h3>
            <p>One free 100-prospect pilot per business domain unless agreed otherwise. Monthly plans bill in advance in CAD plus applicable taxes; cancellation applies at period end.</p>
          </li>
        </ol>
      </section>

      ${renderSections(content.sections)}

      <section aria-labelledby="terms-faq">
        <h2 id="terms-faq">${escapeHtml(content.faqTitle)}</h2>
        ${renderFaqs(faqs)}
      </section>

      <section aria-labelledby="terms-proof">
        <h2 id="terms-proof">Verified results and credibility</h2>
        <ul>
          <li><strong>Pilot case study:</strong> Reply rates moved from 2.1% (generic baseline) to 9.6% (Dossier openers) across 4,200 tracked emails in three outbound campaigns.</li>
          <li><strong>QA methodology:</strong> Every opener is scored 1–5 by a separate QA pass; approximately 15–20% of openers are rejected before delivery.</li>
          <li><strong>Operator transparency:</strong> Ara Ghahramanyan, Montreal, Quebec, Canada — PIPEDA-aligned privacy practices documented publicly at <a href="${SITE_URL}/privacy">${SITE_URL}/privacy</a>.</li>
        </ul>
      </section>

      <nav aria-label="Legal">
        <p><a href="${SITE_URL}/">Home</a> · <a href="${SITE_URL}/contact">Contact</a> · <a href="${SITE_URL}/privacy">Privacy Policy</a></p>
      </nav>
    </div>`
}

export function buildPrivacyStaticMarkup() {
  const content = getPrivacyContent('en', LEGAL_VARS)
  const faqs = getPrivacyFaq('en')
  const h1 = PAGE_TITLES['/privacy']

  return `
    <div id="crawl-fallback" class="crawl-fallback">
      <header>
        <p><a href="${SITE_URL}/">Dossier</a> · <a href="${SITE_URL}/terms">Terms of Service</a></p>
        <h1>${escapeHtml(h1)}</h1>
        <p><strong>${escapeHtml(content.lastUpdatedLabel)}</strong> ${escapeHtml(LEGAL_LAST_UPDATED)}</p>
        <p>${escapeHtml(content.intro)}</p>
      </header>

      <section aria-labelledby="privacy-what">
        <h2 id="privacy-what">What is Dossier's Privacy Policy?</h2>
        <p>
          Dossier's Privacy Policy explains how ${escapeHtml(LEGAL_OPERATOR)} collects, uses, retains,
          and protects personal information when you use ${escapeHtml(LEGAL_VARS.websiteHost)}, submit a
          pilot form, upload prospect CSVs, or book a call. It covers PIPEDA and Quebec Law 25 obligations,
          processor list (Cal.com, Cloudflare, Stripe, Anthropic, Apify), and 90-day deletion of prospect files.
        </p>
      </section>

      <section aria-labelledby="privacy-top3">
        <h2 id="privacy-top3">Top 3 privacy facts about Dossier</h2>
        <ol>
          <li>
            <h3>We collect only what we need to deliver your order</h3>
            <p>Contact details, pilot form fields, Cal.com bookings, prospect CSV uploads, and basic website analytics.</p>
          </li>
          <li>
            <h3>Prospect CSVs are confidential client data</h3>
            <p>Uploaded prospect lists are used only to fulfill your order and deleted within 90 days after delivery unless you request earlier deletion.</p>
          </li>
          <li>
            <h3>We do not sell personal information</h3>
            <p>Privacy requests can be sent to ${escapeHtml(LEGAL_EMAIL)}. Quebec and Canadian access, correction, and deletion rights apply.</p>
          </li>
        </ol>
      </section>

      ${renderSections(content.sections)}

      <section aria-labelledby="privacy-faq">
        <h2 id="privacy-faq">${escapeHtml(content.faqTitle)}</h2>
        ${renderFaqs(faqs)}
      </section>

      <section aria-labelledby="privacy-proof">
        <h2 id="privacy-proof">Why clients trust Dossier with their data</h2>
        <ul>
          <li><strong>Verified operator:</strong> Ara Ghahramanyan, Montreal, Quebec, Canada — a named individual with a public LinkedIn profile and direct email contact.</li>
          <li><strong>No data selling:</strong> Prospect CSV files used only to fulfill orders; deleted within 90 days. We have never sold or shared client prospect data.</li>
          <li><strong>Proven track record:</strong> Pilot campaigns moved reply rates from 2.1% baseline to 9.6% — transparent methodology, no black-box AI, research signals cited per opener.</li>
          <li><strong>Compliance:</strong> PIPEDA and Quebec Law 25 aligned. Privacy requests handled within 30 days. Processor list disclosed publicly.</li>
        </ul>
      </section>

      <nav aria-label="Legal">
        <p><a href="${SITE_URL}/">Home</a> · <a href="${SITE_URL}/contact">Contact</a> · <a href="${SITE_URL}/terms">Terms of Service</a></p>
      </nav>
    </div>`
}

export function buildContactStaticMarkup() {
  const tel = legalPhoneTel()
  const phoneOrCall = tel
    ? `<li><strong>Phone:</strong> <a href="tel:${escapeHtml(tel)}">${escapeHtml(LEGAL_PHONE)}</a></li>`
    : `<li><strong>Schedule a call:</strong> <a href="${SITE_URL}/book-call">${SITE_URL}/book-call</a> — 30-minute fit assessment via Zoom or Microsoft Teams</li>`

  return `
    <div id="crawl-fallback" class="crawl-fallback">
      <header>
        <p><a href="${SITE_URL}/">Dossier</a> · <a href="${SITE_URL}/service">Service</a></p>
        <h1>Contact Dossier, Email, phone, and scheduling</h1>
        <p>
          To contact Dossier, email <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a> — replies within
          one business day (${escapeHtml(LEGAL_BUSINESS_HOURS)}). For pilot requests: send a CSV with
          prospect names, LinkedIn URLs, company names, and emails; receive 3 QA-scored opener variants
          per prospect within 24 to 48 hours, no credit card required. Starter plan: $499/mo for 500
          prospects. Growth plan: $999/mo for 2,000 prospects.
        </p>
      </header>

      <section aria-labelledby="contact-how">
        <h2 id="contact-how">How to contact Dossier</h2>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a> — response within 1 business day</li>
          ${phoneOrCall}
          <li><strong>Free pilot form:</strong> <a href="${SITE_URL}/free-lines">${SITE_URL}/free-lines</a></li>
          <li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/ara-ghahramanyan-086261405/">Ara Ghahramanyan</a></li>
        </ul>
      </section>

      <section aria-labelledby="contact-top3">
        <h2 id="contact-top3">Top 3 reasons to contact Dossier</h2>
        <ol>
          <li>
            <h3>Start a free 100-prospect pilot</h3>
            <p>Receive 3 QA-scored cold email opener variants per prospect in a CSV within 24 to 48 hours. No credit card or sequencer access required. One free pilot per business domain.</p>
          </li>
          <li>
            <h3>Ask about paid monthly plans</h3>
            <p>Starter: $499/month for 500 prospects. Growth: $999/month for 2,000 prospects. Agency: custom volume and delivery speed — email for a quote.</p>
          </li>
          <li>
            <h3>Book a 30-minute fit call</h3>
            <p>Available at <a href="${SITE_URL}/book-call">${SITE_URL}/book-call</a> via Zoom or Microsoft Teams. Agenda: your ICP, one live QA-scored opener example, and whether the free pilot fits your workflow. Hours: ${escapeHtml(LEGAL_BUSINESS_HOURS)}.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="contact-business">
        <h2 id="contact-business">Business details</h2>
        <ul>
          <li><strong>Operator:</strong> ${escapeHtml(LEGAL_OPERATOR)}</li>
          <li><strong>Service:</strong> ${escapeHtml(LEGAL_ENTITY)} — B2B prospect research and personalized cold email opener service</li>
          <li><strong>Website:</strong> <a href="${SITE_URL}">${SITE_URL}</a></li>
          <li><strong>Email:</strong> <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a></li>
          <li><strong>Location:</strong> ${escapeHtml(LEGAL_CITY)}, Quebec, Canada</li>
          <li><strong>Jurisdiction:</strong> ${escapeHtml(LEGAL_JURISDICTION)}</li>
          <li><strong>Hours:</strong> ${escapeHtml(LEGAL_BUSINESS_HOURS)}</li>
          <li><strong>Privacy policy:</strong> <a href="${SITE_URL}/privacy">${SITE_URL}/privacy</a> — last updated ${escapeHtml(LEGAL_LAST_UPDATED)}</li>
          <li><strong>Data rights:</strong> Email <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a> for access, correction, or deletion under PIPEDA and Quebec Law 25; 30-day response window</li>
        </ul>
      </section>

      <nav aria-label="Contact">
        <p>
          <a href="${SITE_URL}/">Home</a> ·
          <a href="${SITE_URL}/service">Service</a> ·
          <a href="${SITE_URL}/pricing">Pricing</a> ·
          <a href="${SITE_URL}/free-lines">Free pilot</a> ·
          <a href="${SITE_URL}/privacy">Privacy Policy</a>
        </p>
      </nav>
    </div>`
}

export function buildBookCallStaticMarkup() {
  const calUrl = calBookingUrl('zoom')

  return `
    <div id="crawl-fallback" class="crawl-fallback">
      <header>
        <p><a href="${SITE_URL}/">Dossier</a> · <a href="${SITE_URL}/contact">Contact</a></p>
        <h1>Book a ${escapeHtml(CAL_MEETING_DURATION_LABEL)} Fit Call with Dossier</h1>
        <p>
          Book a free ${escapeHtml(CAL_MEETING_DURATION_LABEL)} fit call with ${escapeHtml(CAL_HOST_NAME)}
          (Founder, ${escapeHtml(LEGAL_ENTITY)}, ${escapeHtml(LEGAL_CITY)}, Quebec, Canada) at
          <a href="${calUrl}">cal.com/preframe</a> via Zoom or Microsoft Teams
          (${escapeHtml(LEGAL_BUSINESS_HOURS)}). We review your ICP, show a live QA-scored opener from
          your niche, and confirm whether the free 100-prospect pilot (3 variants per prospect, CSV in
          24 to 48 hours, $0) makes sense for your outbound campaign. No credit card, no commitment.
        </p>
      </header>

      <section aria-labelledby="bc-how">
        <h2 id="bc-how">How to book the call</h2>
        <ul>
          <li><strong>Scheduling link:</strong> <a href="${calUrl}">${calUrl}</a></li>
          <li><strong>Duration:</strong> ${escapeHtml(CAL_MEETING_DURATION_LABEL)}</li>
          <li><strong>Format:</strong> Zoom or Microsoft Teams</li>
          <li><strong>Host:</strong> ${escapeHtml(CAL_HOST_NAME)}, ${escapeHtml(LEGAL_CITY)}, Quebec, Canada</li>
          <li><strong>Hours:</strong> ${escapeHtml(LEGAL_BUSINESS_HOURS)}</li>
          <li><strong>Email (if you prefer async):</strong> <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a></li>
          <li><strong>Cost:</strong> Free — no credit card, no commitment</li>
        </ul>
      </section>

      <section aria-labelledby="bc-agenda">
        <h2 id="bc-agenda">3-step agenda for the fit call</h2>
        <ol>
          <li>
            <h3>Understand your ICP and current results</h3>
            <p>We ask about your target market, sequencer (Smartlead, Instantly, Lemlist, or other), current reply-rate baseline, and what you have already tested. Takes about five minutes.</p>
          </li>
          <li>
            <h3>Show a live opener example from your niche</h3>
            <p>We pull up a real prospect from your ICP and show what a Dossier QA-scored opener looks like — including the research signal used, confidence score (1 to 5), and opener variants. Pilot campaigns have seen reply rates move from a baseline of 2.1% to 9.6%.</p>
          </li>
          <li>
            <h3>Confirm whether the free pilot makes sense</h3>
            <p>If Dossier is a fit, we align on the next step: you send your 100-prospect CSV within 24 hours and receive personalized openers within 48 hours at no cost. If it is not a fit, we say so directly — no follow-up pressure.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="bc-top3">
        <h2 id="bc-top3">Top 3 reasons to book a call with Dossier</h2>
        <ol>
          <li>
            <h3>See a live example before committing to anything</h3>
            <p>We write or show a real QA-scored opener for a prospect in your niche during the call so you can evaluate quality before the pilot starts.</p>
          </li>
          <li>
            <h3>Get an honest fit assessment</h3>
            <p>We tell you whether your problem is an opener problem, an ICP problem, or an offer problem. Only the opener problem is one Dossier solves. If Dossier is not the right fit, we say so without follow-up pressure.</p>
          </li>
          <li>
            <h3>Start a free 100-prospect pilot immediately</h3>
            <p>If the call confirms a fit, you send your CSV within 24 hours and receive 3 QA-scored opener variants per prospect in a ready-to-import CSV within 48 hours. Cost: $0. No sequencer access required.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="bc-who">
        <h2 id="bc-who">Who the call is for</h2>
        <ul>
          <li><strong>Cold email agencies</strong> — managing campaigns for multiple clients and needing to scale personalization across ICPs.</li>
          <li><strong>B2B founders doing outbound</strong> — running cold email and wanting to improve reply rates before hiring an SDR team.</li>
          <li><strong>SDR teams</strong> — sending 500 or more emails per week where reply rate determines headcount decisions.</li>
          <li><strong>Lead gen operators</strong> — running high-volume campaigns where generic openers have stopped working.</li>
        </ul>
      </section>

      <section aria-labelledby="bc-about">
        <h2 id="bc-about">About Dossier</h2>
        <ul>
          <li><strong>Operator:</strong> ${escapeHtml(CAL_HOST_NAME)}</li>
          <li><strong>Service:</strong> B2B prospect research and personalized cold email opener delivery (CSV format)</li>
          <li><strong>Location:</strong> ${escapeHtml(LEGAL_CITY)}, Quebec, Canada</li>
          <li><strong>Scheduling:</strong> <a href="${calUrl}">${calUrl}</a></li>
          <li><strong>Email:</strong> <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a></li>
          <li><strong>Pilot pricing:</strong> $0 for 100 prospects (free pilot), Starter $499/mo (500 prospects), Growth $999/mo (2,000 prospects)</li>
          <li><strong>Delivery SLA:</strong> 24 to 48 hours for pilot batches after CSV intake</li>
        </ul>
      </section>

      <nav aria-label="Book a call">
        <p>
          <a href="${SITE_URL}/">Home</a> ·
          <a href="${SITE_URL}/service">Service</a> ·
          <a href="${SITE_URL}/free-lines">Free pilot</a> ·
          <a href="${SITE_URL}/contact">Contact</a> ·
          <a href="${SITE_URL}/pricing">Pricing</a>
        </p>
      </nav>
    </div>`
}

export const STATIC_LEGAL_PAGES = [
  {
    route: '/terms',
    buildMarkup: buildTermsStaticMarkup,
  },
  {
    route: '/privacy',
    buildMarkup: buildPrivacyStaticMarkup,
  },
  {
    route: '/contact',
    buildMarkup: buildContactStaticMarkup,
  },
  {
    route: '/book-call',
    buildMarkup: buildBookCallStaticMarkup,
  },
]
