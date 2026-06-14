import { motion } from 'framer-motion'
import { Section, ContainerSm, Eyebrow, fadeUp } from '../components/ui'
import {
  LEGAL_ENTITY,
  LEGAL_OPERATOR,
  LEGAL_WEBSITE,
  LEGAL_EMAIL,
  LEGAL_LAST_UPDATED,
} from '../lib/legal'

function PolicySection({ title, children }) {
  return (
    <motion.section {...fadeUp} className="mb-10">
      <h2 className="font-display text-xl font-bold text-ink mb-4 pb-3 border-b border-border">{title}</h2>
      <div className="text-muted leading-relaxed text-[0.95rem] space-y-3">{children}</div>
    </motion.section>
  )
}

function P({ children }) {
  return <p>{children}</p>
}

function Ul({ items }) {
  return (
    <ul className="list-disc list-inside space-y-1.5 pl-1">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export default function Privacy() {
  return (
    <>
      <Section className="pt-32 pb-10">
        <ContainerSm>
          <motion.div {...fadeUp} className="mb-10">
            <Eyebrow>Legal</Eyebrow>
            <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-muted text-sm">Last updated: {LEGAL_LAST_UPDATED}</p>
          </motion.div>

          <PolicySection title="1. Who we are">
            <P>
              {LEGAL_ENTITY} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a B2B prospect research and
              email-personalization service operated by {LEGAL_OPERATOR}, based in Canada. Our website is{' '}
              <a href={LEGAL_WEBSITE} className="text-navy hover:underline">{LEGAL_WEBSITE.replace('https://', '')}</a>.
            </P>
            <P>
              This Privacy Policy describes how we collect, use, disclose, and protect personal information in
              accordance with Canadian privacy law, including the{' '}
              <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA), and — where applicable —
              Quebec&apos;s <em>Act respecting the protection of personal information in the private sector</em> (Law 25),
              Alberta&apos;s Personal Information Protection Act (PIPA), and British Columbia&apos;s Personal Information
              Protection Act (PIPA).
            </P>
            <P>
              Privacy inquiries and requests:{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-navy hover:underline">{LEGAL_EMAIL}</a>.
            </P>
          </PolicySection>

          <PolicySection title="2. What personal information we collect">
            <P>We collect only what we need to operate our service. Categories include:</P>
            <p className="font-semibold text-ink mt-2 mb-1">Information you provide</p>
            <Ul items={[
              'Name, work email address, company name, and sequencer platform when you submit the free pilot form.',
              'LinkedIn profile URL or website URL submitted with a pilot request.',
              'Name, email, and scheduling details when you book a call through Cal.com.',
              'Messages you send us by email or through our contact channels.',
              'Billing and account information for paid plans (payment card data is handled by our payment processor, not stored by us).',
            ]} />
            <p className="font-semibold text-ink mt-4 mb-1">Prospect data you upload (about third parties)</p>
            <Ul items={[
              'CSV files or lists containing business prospect names, job titles, companies, LinkedIn URLs, and related business contact data.',
              'This information relates to your prospects, not to you. We treat it as confidential client data and use it only to fulfill your order.',
              'You are responsible for having a lawful basis to provide this data to us and to use our deliverables (see our Terms of Service).',
            ]} />
            <p className="font-semibold text-ink mt-4 mb-1">Technical information</p>
            <Ul items={[
              'IP address, browser type, device type, and approximate region from web server logs.',
              'Pages visited and referral source, if we use privacy-respecting analytics.',
            ]} />
          </PolicySection>

          <PolicySection title="3. How we use personal information">
            <P>We use personal information for legitimate business purposes, including:</P>
            <Ul items={[
              'Delivering your order: researching prospects, writing openers, and returning CSV deliverables.',
              'Communicating about your order, pilot request, or account.',
              'Processing payments and preventing fraud.',
              'Sending transactional messages (confirmations, delivery notices, scheduling updates).',
              'Improving service quality using aggregated, non-identifying feedback.',
              'Complying with legal obligations and responding to lawful requests.',
            ]} />
            <P>
              We do not sell personal information. We do not use your prospect lists for any purpose other than
              fulfilling your order. We do not run advertising retargeting or sell data to data brokers.
            </P>
          </PolicySection>

          <PolicySection title="4. Consent and legal authority (PIPEDA)">
            <P>
              Under PIPEDA, we collect, use, and disclose personal information with your knowledge and consent,
              except where the law permits or requires otherwise. In practice:
            </P>
            <Ul items={[
              'When you submit a form, book a call, or purchase a plan, you consent to the collection and use described in this policy for that purpose.',
              'We may rely on implied consent for follow-up communications directly related to a request you initiated.',
              'For commercial electronic messages (marketing email), we follow Canada\'s Anti-Spam Legislation (CASL) and obtain express consent where required, or rely on a permitted form of implied consent (for example, an existing business relationship). Every marketing message includes identification and an unsubscribe mechanism.',
              'We may process information without consent where required or authorized by law (for example, fraud prevention or responding to a court order).',
            ]} />
          </PolicySection>

          <PolicySection title="5. Cookies and website analytics">
            <P>
              Our site may set strictly necessary cookies required for security and basic operation (for example,
              session or anti-abuse tokens on forms).
            </P>
            <P>
              If we use optional analytics cookies or similar technologies, we will describe them here and — where
              required by Canadian or provincial law — obtain your consent before activating non-essential tracking.
              We do not use Google Analytics advertising features or ad-retargeting pixels.
            </P>
          </PolicySection>

          <PolicySection title="6. Service providers and cross-border processing">
            <P>
              We use trusted third-party providers to operate our business. Some may process data outside Canada
              (including in the United States). Under PIPEDA, we remain accountable for personal information
              transferred to service providers and require protections comparable to Canadian standards.
            </P>
            <Ul items={[
              'Cal.com — scheduling; processes name and email when you book a call.',
              'Cloudflare — website hosting and security (Pages, CDN).',
              'Payment processor (e.g. Stripe) — billing; we do not store full payment card numbers.',
              'Email delivery provider — transactional email.',
              'Anthropic — AI processing for research and opener generation on prospect data you submit.',
              'Apify — automated retrieval of publicly available LinkedIn profile information for research.',
              'Database hosting — secure storage of order and account records.',
            ]} />
            <P>
              Each provider maintains its own privacy policy. We share only what is necessary for them to perform
              services on our behalf.
            </P>
          </PolicySection>

          <PolicySection title="7. Retention">
            <P>We keep personal information only as long as needed for the purposes described above:</P>
            <Ul items={[
              'Order data and prospect CSVs: up to 90 days after delivery, then securely deleted unless you request earlier deletion or a longer period is agreed in writing.',
              'Pilot intake records: up to 12 months after last contact, unless you request deletion sooner.',
              'Billing and tax records: up to 7 years, as required under Canadian tax and commercial record-keeping rules.',
              'Server logs: typically up to 90 days, unless needed for security investigations.',
            ]} />
          </PolicySection>

          <PolicySection title="8. Safeguards">
            <P>We apply reasonable administrative, technical, and physical safeguards, including:</P>
            <Ul items={[
              'HTTPS/TLS encryption in transit.',
              'Access controls limiting prospect data to personnel fulfilling your order.',
              'No public storage of client prospect files.',
              'PCI-compliant payment processing — card numbers are not stored on our servers.',
            ]} />
            <P>
              No method of transmission or storage is completely secure. If a breach creates a real risk of
              significant harm to you, we will notify you and — where required — the Office of the Privacy
              Commissioner of Canada and/or the Commission d&apos;accès à l&apos;information du Québec, in line
              with applicable law.
            </P>
          </PolicySection>

          <PolicySection title="9. Your rights">
            <P>
              Depending on where you live in Canada, you may have the right to:
            </P>
            <Ul items={[
              'Access the personal information we hold about you.',
              'Request correction of inaccurate or incomplete information.',
              'Request deletion, subject to legal retention obligations.',
              'Withdraw consent to optional processing (for example, marketing), without affecting prior lawful processing.',
              'Receive information about how your data is used and with whom it is shared.',
            ]} />
            <P>
              Quebec residents may have additional rights under Law 25, including data portability in certain
              circumstances and the right to request cessation of dissemination in specific cases.
            </P>
            <P>
              To exercise your rights, email{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-navy hover:underline">{LEGAL_EMAIL}</a>.
              We will respond within 30 days (or the shorter period required by applicable provincial law).
              We may need to verify your identity before fulfilling a request.
            </P>
            <P>
              If you are not satisfied with our response, you may contact:
            </P>
            <Ul items={[
              'Office of the Privacy Commissioner of Canada (federal): priv.gc.ca',
              'Commission d\'accès à l\'information du Québec (Quebec): cai.gouv.qc.ca',
              'Office of the Information and Privacy Commissioner of Alberta (Alberta): oipc.ab.ca',
              'Office of the Information and Privacy Commissioner for British Columbia (BC): oipc.bc.ca',
            ]} />
          </PolicySection>

          <PolicySection title="10. International visitors">
            <P>
              Our service is offered from Canada. If you access our website from outside Canada, your information
              may be transferred to and processed in Canada and in other countries where our service providers
              operate. By using our service, you acknowledge that protections may differ from those in your country.
              Where GDPR or UK GDPR applies to you in addition to Canadian law, we process your data on bases
              including contract performance, legitimate interests, legal obligation, and consent where required.
            </P>
          </PolicySection>

          <PolicySection title="11. Children">
            <P>
              Our service is directed at businesses and professionals. We do not knowingly collect personal
              information from anyone under 18. If you believe we have collected such information, contact us
              and we will delete it promptly.
            </P>
          </PolicySection>

          <PolicySection title="12. Changes">
            <P>
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top
              will change when we do. Material changes will be communicated to active clients by email or a
              prominent notice on our website.
            </P>
          </PolicySection>

          <PolicySection title="13. Contact">
            <P>
              Questions or complaints about privacy:{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-navy hover:underline">{LEGAL_EMAIL}</a>.
              You may also book a call through our scheduling page at {LEGAL_WEBSITE}/book-call.
            </P>
            <P className="text-muted-2 text-xs mt-4">
              This policy is provided for transparency and does not constitute legal advice. Consult qualified
              counsel for advice specific to your situation.
            </P>
          </PolicySection>
        </ContainerSm>
      </Section>
    </>
  )
}
