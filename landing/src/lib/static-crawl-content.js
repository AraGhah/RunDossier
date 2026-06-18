import { LEGAL_EMAIL, LEGAL_BUSINESS_HOURS } from './legal'
import { HOME_FAQ, LINKEDIN_HANDLE, LINKEDIN_URL, CAL_PUBLIC_HANDLE, CAL_PUBLIC_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from './site-data'

function phoneMarkup(phone) {
  const trimmed = (phone || '').trim()
  if (!trimmed) return ''
  const tel = trimmed.replace(/[^\d+]/g, '')
  const href = tel.startsWith('+') ? tel : `+${tel.replace(/^\+/, '')}`
  return `<p><strong>Phone:</strong> <a href="tel:${href}">${trimmed}</a></p>`
}

/** Server-visible HTML for crawlers and no-JS clients. Hidden once React boots (html.js). */
export function buildStaticCrawlMarkup({ phone = '' } = {}) {
  const faqItems = HOME_FAQ.map(
    (item) => `
      <article>
        <h3>${item.q}</h3>
        <p>${item.a}</p>
      </article>`,
  ).join('\n')

  return `
    <div id="crawl-fallback" class="crawl-fallback">
      <header>
        <p><a href="${SITE_URL}/">${SITE_NAME}</a></p>
        <h1>${SITE_NAME} — ${SITE_TAGLINE}</h1>
        <p>${SITE_DESCRIPTION}</p>
      </header>

      <section aria-labelledby="crawl-what">
        <h2 id="crawl-what">What is Dossier?</h2>
        <p>
          Dossier is a B2B service that researches each prospect and writes three QA-scored cold email
          openers you import into Smartlead, Instantly, Lemlist, or any CSV-based sequencer. We do not
          send emails or access your inboxes.
        </p>
      </section>

      <section aria-labelledby="crawl-how">
        <h2 id="crawl-how">How does Dossier personalize cold email openers?</h2>
        <p>
          For every prospect, we extract a verifiable public signal (LinkedIn post, launch, hiring news,
          or company update), draft three opener variants, run a separate QA pass (1 to 5 scale), and
          return a CSV with signals, scores, and thin-profile flags within 24 to 48 hours for a
          100-prospect pilot.
        </p>
      </section>

      <section aria-labelledby="crawl-top3">
        <h2 id="crawl-top3">Top 3 reasons outbound teams choose Dossier</h2>
        <ol>
          <li><h3>Research-backed openers beat generic AI templates</h3><p>Each line cites a real public signal instead of name-and-title filler, which is why pilot campaigns moved from 3.1% to 9.6% reply rate in early case studies.</p></li>
          <li><h3>QA scoring rejects weak copy before delivery</h3><p>Low-specificity openers are flagged or rewritten so your reps never import slop into a warmed domain.</p></li>
          <li><h3>No sequencer access required</h3><p>CSV delivery only. You keep deliverability, volume, and offer control while we handle prospect research and opener QA.</p></li>
        </ol>
      </section>

      <section aria-labelledby="crawl-intro">
        <h2 id="crawl-intro">Personalized outbound openers for B2B cold email</h2>
        <p>
          ${SITE_NAME} is a done-for-you research service for outbound agencies and B2B founders.
          We review public signals per prospect, including LinkedIn posts, product launches, hiring moves,
          and company news, then write three QA-scored first lines you import into your sequencer.
        </p>
        <p>
          Every delivery includes the research signal, confidence scoring, and thin-profile flags.
          Typical pilot turnaround is 24 to 48 hours for 100 prospects. No inbox access, no campaign
          permissions, and no credit card required to start the free pilot.
        </p>
        <p>
          ${SITE_NAME} does not send emails on your behalf. You keep full control of volume, offer, and
          deliverability while we handle prospect research and opener quality assurance.
        </p>
      </section>

      <section aria-labelledby="crawl-top5">
        <h2 id="crawl-top5">Top 5 signals Dossier uses for personalized openers</h2>
        <ol>
          <li><h3>Recent LinkedIn posts and commentary</h3><p>We capture what the prospect publicly said in the last 90 days and anchor the opener to a specific idea, not a job title.</p></li>
          <li><h3>Product launches and positioning shifts</h3><p>New features, rebrands, and ICP changes give concrete hooks that generic templates miss.</p></li>
          <li><h3>Hiring and team expansion patterns</h3><p>Open roles and leadership hires signal priorities you can reference without flattery.</p></li>
          <li><h3>Company news and funding milestones</h3><p>Press releases and credible third-party coverage help us write fact-checked openers with traceable signals.</p></li>
          <li><h3>Industry context and peer comparisons</h3><p>We connect the prospect's situation to patterns seen across similar B2B companies so the line reads researched, not generated.</p></li>
        </ol>
      </section>

      <section aria-labelledby="crawl-hiw">
        <h2 id="crawl-hiw">How the Dossier pilot works</h2>
        <h3>Step 1: Send your prospect list</h3>
        <p>Upload a CSV with names, LinkedIn URLs, company names, and emails. Clay, Apollo, and manual lists all work.</p>
        <h3>Step 2: We research and QA-score every opener</h3>
        <p>Each prospect gets three opener variants plus the signal used, a QA score from 1 to 5, and a confidence flag.</p>
        <h3>Step 3: Import the CSV into your sequencer</h3>
        <p>Deliveries are formatted for Smartlead, Instantly, Lemlist, EmailBison, Clay, and Apollo CSV workflows.</p>
      </section>

      <section aria-labelledby="crawl-products">
        <h2 id="crawl-products">Products</h2>
        <ul>
          <li><strong>100 Free Lines Pilot</strong> — 100 prospects, three QA-scored openers each, delivered as CSV in 24 to 48 hours. Price: $0, no credit card required.</li>
          <li><strong>Starter Plan</strong> — $499 per month for 500 prospects per month. Three opener variants each, CSV delivery, email support.</li>
          <li><strong>Growth Plan</strong> — $999 per month for 2,000 prospects per month. Priority delivery and dedicated support.</li>
          <li><strong>Agency Plan</strong> — custom volume, white-label CSV, SLA, and integrations. Contact for pricing.</li>
        </ul>
        <p>See full pricing at <a href="${SITE_URL}/pricing">${SITE_URL}/pricing</a>.</p>
      </section>

      <section aria-labelledby="crawl-policies">
        <h2 id="crawl-policies">Policies</h2>
        <ul>
          <li><strong><a href="${SITE_URL}/privacy">Privacy Policy</a></strong> — PIPEDA and Quebec Law 25 compliance. How we collect, use, and delete prospect data. Operated by Ara Ghahramanyan, Montreal, Canada.</li>
          <li><strong><a href="${SITE_URL}/terms">Terms of Service</a></strong> — Usage rules for the free pilot, paid plans, CSV deliverables, billing, cancellation, and compliance responsibilities.</li>
          <li><strong>Data requests</strong> — Email <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a> for access, correction, or deletion under PIPEDA and Quebec Law 25. 30-day response window.</li>
        </ul>
      </section>

      <section aria-labelledby="crawl-faq">
        <h2 id="crawl-faq">Frequently asked questions</h2>
        ${faqItems}
      </section>

      <section aria-labelledby="crawl-trust">
        <h2 id="crawl-trust">Trust signals, proof, and verified results</h2>
        <p>
          Dossier is operated by Ara Ghahramanyan in Montreal, Quebec, Canada, with PIPEDA-aligned
          privacy practices documented on our Privacy Policy page. Pilot clients received QA-scored
          CSV deliverables with verified research signals cited per opener.
        </p>
        <ul>
          <li><strong>Case study proof:</strong> 3.1% to 9.6% reply rate across three outbound pilot campaigns (4,200 emails sent).</li>
          <li><strong>Client testimonials:</strong> Illustrative opener examples and founder quotes published on the home and free-lines pages.</li>
          <li><strong>Transparent methodology:</strong> Three opener variants per prospect, confidence flags, and documented retention in our privacy policy.</li>
        </ul>
      </section>

      <section aria-labelledby="crawl-profiles">
        <h2 id="crawl-profiles">Public profiles — find Dossier online</h2>
        <ul>
          <li><strong>LinkedIn (founder):</strong> <a href="${LINKEDIN_URL}" rel="me">${LINKEDIN_HANDLE}</a> — Ara Ghahramanyan, founder of Dossier</li>
          <li><strong>Cal.com (scheduling):</strong> <a href="${CAL_PUBLIC_URL}">${CAL_PUBLIC_HANDLE}</a> — 30-minute fit call</li>
        </ul>
      </section>

      <section aria-labelledby="crawl-contact">
        <h2 id="crawl-contact">Contact Dossier</h2>
        <address>
          <p>Dossier · Montreal, Quebec · Province of Quebec, Canada</p>
          <p><strong>Hours:</strong> ${LEGAL_BUSINESS_HOURS}</p>
          <p><strong>Email:</strong> <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a></p>
          ${phoneMarkup(phone)}
          <p><strong>Schedule a call:</strong> <a href="${SITE_URL}/book-call" rel="contact">${SITE_URL}/book-call</a> (30-minute fit assessment)</p>
          <p>
            <strong>LinkedIn:</strong>
            <a href="${LINKEDIN_URL}" rel="me">${LINKEDIN_HANDLE}</a>
          </p>
          <p>
            <strong>Cal.com:</strong>
            <a href="${CAL_PUBLIC_URL}" rel="contact">${CAL_PUBLIC_HANDLE}</a>
          </p>
        </address>
        <p><a href="${SITE_URL}/contact">Contact page</a> · <a href="${SITE_URL}/service">Service details</a> · <a href="${SITE_URL}/free-lines">Start free pilot</a></p>
      </section>

      <nav aria-label="Site">
        <h2>Pages</h2>
        <ul>
          <li><a href="${SITE_URL}/">Home</a></li>
          <li><a href="${SITE_URL}/service">Service</a></li>
          <li><a href="${SITE_URL}/pricing">Pricing</a></li>
          <li><a href="${SITE_URL}/about">About</a></li>
          <li><a href="${SITE_URL}/free-lines">100 Free Lines</a></li>
          <li><a href="${SITE_URL}/book-call">Book a Call</a></li>
          <li><a href="${SITE_URL}/contact">Contact</a></li>
        </ul>
      </nav>
    </div>`
}
