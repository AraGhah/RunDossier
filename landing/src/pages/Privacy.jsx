import { motion } from 'framer-motion'
import { Section, Container, ContainerSm, Eyebrow, fadeUp } from '../components/ui'

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
            <p className="text-muted text-sm">Last updated: June 13, 2026</p>
          </motion.div>

          <PolicySection title="1. Who we are">
            <P>Dossier ("we," "us," or "our") is a B2B personalization service that researches prospects and delivers research-backed email opening lines to clients. Our registered contact email is listed on our About page.</P>
            <P>This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and what rights you have over it.</P>
          </PolicySection>

          <PolicySection title="2. What data we collect">
            <P>We collect the following categories of personal data:</P>
            <p className="font-semibold text-ink mt-2 mb-1">Data you provide directly</p>
            <Ul items={[
              'Name and email address when you submit the free pilot request form.',
              'Company name and the sequencer platform you use (Instantly, Smartlead, Apollo, etc.).',
              'LinkedIn profile URL submitted as part of the pilot intake.',
              'Any messages or content you send us through our contact or booking channels.',
            ]} />
            <p className="font-semibold text-ink mt-4 mb-1">Prospect data you upload</p>
            <Ul items={[
              'CSV files or lists of business prospect names, titles, companies, and LinkedIn URLs that you provide for us to research.',
              'This data relates to third parties (your prospects), not to you personally. We treat it as confidential business data and do not use it beyond delivering your order.',
            ]} />
            <p className="font-semibold text-ink mt-4 mb-1">Technical and usage data</p>
            <Ul items={[
              'IP address, browser type, and approximate location via standard web server logs.',
              'Pages visited and time spent, collected via analytics (see Section 5).',
            ]} />
          </PolicySection>

          <PolicySection title="3. How we use your data">
            <P>We use the data we collect only for the following purposes:</P>
            <Ul items={[
              'To deliver your order: researching prospects, writing openers, and returning a CSV to you.',
              'To communicate with you about your order status, questions, or follow-ups.',
              'To process payments and prevent fraud (via our payment processor).',
              'To send transactional emails related to your account or order.',
              'To improve our research quality based on aggregated, anonymised feedback.',
              'To comply with legal obligations if required by law.',
            ]} />
            <P>We do not use your data for advertising, we do not sell it to third parties, and we do not use your prospect lists for any purpose other than fulfilling your order.</P>
          </PolicySection>

          <PolicySection title="4. Legal basis for processing (GDPR)">
            <P>If you are located in the European Economic Area (EEA) or United Kingdom, our legal bases for processing are:</P>
            <Ul items={[
              'Contract performance: to fulfill the service you requested.',
              'Legitimate interests: to improve our service quality and prevent fraud.',
              'Legal obligation: when required to comply with applicable law.',
              'Consent: for any optional marketing communications (you can withdraw at any time).',
            ]} />
          </PolicySection>

          <PolicySection title="5. Analytics and tracking">
            <P>Our website may use privacy-respecting analytics tools to understand how visitors use the site (e.g., which pages are most visited). We do not use Google Analytics' advertising features. We do not run retargeting pixels or ad tracking.</P>
            <P>If we use cookies beyond those strictly necessary to operate the site, we will ask for your consent before setting them.</P>
          </PolicySection>

          <PolicySection title="6. Third-party services">
            <P>We use the following third-party services to operate our business. Each has its own privacy policy:</P>
            <Ul items={[
              'Cal.com — for scheduling discovery calls. Cal.com processes your name and email when you book.',
              'Stripe (or equivalent) — for payment processing. We do not store your payment card details.',
              'Email delivery provider — for transactional emails (order confirmations, CSV delivery).',
            ]} />
            <P>We only share data with third parties to the extent necessary to operate our service. We do not sell data.</P>
          </PolicySection>

          <PolicySection title="7. Data retention">
            <P>We retain your personal data only for as long as needed:</P>
            <Ul items={[
              'Order data and prospect CSVs: retained for 90 days after delivery, then securely deleted unless you request earlier deletion.',
              'Billing records: retained for 7 years as required by law.',
              'Contact and pilot intake data: retained for 12 months after last contact.',
            ]} />
            <P>You may request earlier deletion at any time (see Section 9).</P>
          </PolicySection>

          <PolicySection title="8. Data security">
            <P>We take reasonable technical and organizational measures to protect your data:</P>
            <Ul items={[
              'All data is transmitted over HTTPS/TLS.',
              'Access to prospect CSV files is restricted to team members fulfilling your order.',
              'We do not store prospect data in publicly accessible locations.',
              'Payment data is handled entirely by our PCI-compliant payment processor; we never see or store card numbers.',
            ]} />
            <P>No method of transmission over the internet is 100% secure. We cannot guarantee absolute security but commit to notifying you promptly if a breach occurs that affects your data.</P>
          </PolicySection>

          <PolicySection title="9. Your rights">
            <P>Depending on your location, you may have the following rights regarding your personal data:</P>
            <Ul items={[
              'Access: request a copy of the personal data we hold about you.',
              'Correction: request that we correct inaccurate or incomplete data.',
              'Deletion: request that we delete your personal data (subject to legal retention requirements).',
              'Portability: request your data in a machine-readable format.',
              'Objection: object to processing based on legitimate interests.',
              'Withdrawal of consent: withdraw any consent you have given at any time.',
            ]} />
            <P>To exercise any of these rights, email us at the contact address on our About page. We will respond within 30 days.</P>
          </PolicySection>

          <PolicySection title="10. Children">
            <P>Our service is directed at businesses and professionals, not individuals under the age of 16. We do not knowingly collect data from minors. If you believe we have inadvertently collected such data, contact us and we will delete it promptly.</P>
          </PolicySection>

          <PolicySection title="11. Changes to this policy">
            <P>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. If the changes are material, we will notify active clients by email.</P>
            <P>Continued use of our service after any update constitutes acceptance of the revised policy.</P>
          </PolicySection>

          <PolicySection title="12. Contact">
            <P>If you have any questions about this Privacy Policy or how we handle your data, please contact us at the email listed on our About page, or book a call through our scheduling page.</P>
          </PolicySection>
        </ContainerSm>
      </Section>
    </>
  )
}
