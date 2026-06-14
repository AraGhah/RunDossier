import { motion } from 'framer-motion'
import { Section, ContainerSm, Eyebrow, fadeUp } from '../components/ui'

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

export default function Terms() {
  return (
    <>
      <Section className="pt-32 pb-10">
        <ContainerSm>
          <motion.div {...fadeUp} className="mb-10">
            <Eyebrow>Legal</Eyebrow>
            <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight mb-3">
              Terms of Service
            </h1>
            <p className="text-muted text-sm">Last updated: June 13, 2026</p>
          </motion.div>

          <PolicySection title="1. Agreement to these terms">
            <P>By accessing our website or using our service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you may not use our service.</P>
            <P>These Terms constitute a legally binding agreement between you (or the business entity you represent, "Client") and Dossier ("we," "us," "our").</P>
          </PolicySection>

          <PolicySection title="2. Description of service">
            <P>Dossier provides a B2B prospect research and personalization service. Specifically, we:</P>
            <Ul items={[
              'Accept lists of business prospects (name, company, LinkedIn URL) submitted by the Client.',
              'Research each prospect using publicly available information.',
              'Write three QA-scored, research-backed email opening lines per prospect.',
              'Deliver the output as a CSV file compatible with the Client\'s email sequencer.',
            ]} />
            <P>Our service is a content creation service, not a managed outbound service. We do not send emails, access your email accounts, or manage your campaigns.</P>
          </PolicySection>

          <PolicySection title="3. Eligibility">
            <P>You must be at least 18 years old and operating as or on behalf of a legitimate business to use Dossier. By using our service you represent that:</P>
            <Ul items={[
              'You have the legal authority to enter into these Terms on behalf of the entity you represent.',
              'You will use our deliverables only in compliance with applicable laws and regulations.',
              'You are not located in, or operating a business primarily in, a jurisdiction where our service is prohibited.',
            ]} />
          </PolicySection>

          <PolicySection title="4. Free pilot offer">
            <P>We offer a free 100-prospect pilot ("Pilot") subject to these conditions:</P>
            <Ul items={[
              'The Pilot is limited to one submission per business domain.',
              'We reserve the right to decline a Pilot request at our sole discretion.',
              'Pilot deliverables are provided "as-is" with no guarantee of outcome.',
              'The Pilot is not redeemable for cash or credit.',
              'We may discontinue the Pilot offer at any time without notice.',
            ]} />
          </PolicySection>

          <PolicySection title="5. Paid plans and billing">
            <P>Paid plans are billed monthly in advance. By subscribing to a paid plan you agree to:</P>
            <Ul items={[
              'Provide accurate and complete billing information.',
              'Pay the applicable monthly fee before service delivery begins for that cycle.',
              'Understand that plan fees are non-refundable except as described in Section 6.',
            ]} />
            <P>We reserve the right to change pricing with 30 days written notice to active subscribers. Price changes apply at the start of the next billing cycle.</P>
            <P>Agency plan pricing is custom and governed by a separate written agreement between the parties.</P>
          </PolicySection>

          <PolicySection title="6. Cancellation and refunds">
            <P>You may cancel your subscription at any time by contacting us before your next billing date. Cancellation takes effect at the end of the current billing period.</P>
            <P>We do not offer prorated refunds for unused days in a billing period. However, if we fail to deliver your order within the stated turnaround time (24 to 48 hours) due to an error on our side, you are entitled to a credit equal to one month's subscription fee.</P>
            <P>Refunds are issued at our discretion for first-time billing errors or technical failures clearly attributable to us.</P>
          </PolicySection>

          <PolicySection title="7. Client obligations">
            <P>As a Client you agree to:</P>
            <Ul items={[
              'Provide accurate prospect data. We are not responsible for openers produced from inaccurate or fabricated inputs.',
              'Use our deliverables in compliance with CAN-SPAM, GDPR, CASL, and all other applicable anti-spam and data protection laws in your target markets.',
              'Not submit prospect lists that include private individuals (B2C), minors, or data obtained through unlawful means.',
              'Not resell or sublicense our deliverables to third parties without our prior written consent.',
              'Not use our service to produce content that is deceptive, harassing, defamatory, or otherwise unlawful.',
            ]} />
          </PolicySection>

          <PolicySection title="8. Intellectual property">
            <P>Upon full payment, you own the opener content we deliver to you. You may use, adapt, and distribute the openers in your campaigns without restriction.</P>
            <P>We retain ownership of our research methodologies, QA frameworks, tooling, and any internal systems used to produce the deliverables. Nothing in these Terms transfers ownership of those to you.</P>
            <P>Our website, brand, and all associated design assets are owned by Dossier and may not be reproduced without permission.</P>
          </PolicySection>

          <PolicySection title="9. Confidentiality">
            <P>Both parties agree to keep the other's confidential information confidential. Specifically:</P>
            <Ul items={[
              'We will not share your prospect lists, business data, or campaign details with any third party except as required to fulfill your order or comply with law.',
              'You will not disclose our pricing structures, internal processes, or proprietary methodologies to competitors.',
            ]} />
            <P>This obligation survives termination of these Terms for a period of 2 years.</P>
          </PolicySection>

          <PolicySection title="10. Disclaimer of warranties">
            <P>Our service is provided "as is" and "as available." We make no warranties, express or implied, including but not limited to:</P>
            <Ul items={[
              'That the openers we deliver will achieve any specific reply rate or campaign outcome.',
              'That our service will be uninterrupted or error-free.',
              'That the research underlying our openers is exhaustive or will remain accurate over time.',
            ]} />
            <P>We are a content and research service. Campaign performance depends on many variables beyond the opener — including your offer, targeting, sequencer configuration, and sending domain reputation. We do not guarantee results.</P>
          </PolicySection>

          <PolicySection title="11. Limitation of liability">
            <P>To the maximum extent permitted by applicable law, Dossier's total liability to you for any claim arising from or related to these Terms or our service shall not exceed the total fees you paid us in the 3 months immediately preceding the claim.</P>
            <P>We are not liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, lost revenue, or reputational harm, even if we have been advised of the possibility of such damages.</P>
          </PolicySection>

          <PolicySection title="12. Indemnification">
            <P>You agree to indemnify, defend, and hold harmless Dossier and its operators from any claim, damages, loss, or expense (including reasonable legal fees) arising from:</P>
            <Ul items={[
              'Your use of our deliverables in violation of applicable law.',
              'Your breach of these Terms.',
              'Any third-party claim arising from the emails you send using our openers.',
            ]} />
          </PolicySection>

          <PolicySection title="13. Termination">
            <P>We reserve the right to suspend or terminate your access to our service immediately and without notice if:</P>
            <Ul items={[
              'You violate any provision of these Terms.',
              'We reasonably believe your use of our service creates legal or reputational risk.',
              'You have an outstanding unpaid balance older than 14 days.',
            ]} />
            <P>You may terminate your account at any time. Termination does not entitle you to a refund for any prepaid period, except as described in Section 6.</P>
          </PolicySection>

          <PolicySection title="14. Governing law and disputes">
            <P>These Terms are governed by the laws of the jurisdiction in which Dossier is registered. Any dispute that cannot be resolved amicably shall be submitted to the exclusive jurisdiction of the courts in that jurisdiction.</P>
            <P>Before initiating any formal dispute, both parties agree to attempt good-faith resolution through direct communication for a minimum of 30 days.</P>
          </PolicySection>

          <PolicySection title="15. Changes to these Terms">
            <P>We may update these Terms at any time. When we do, we will update the "Last updated" date at the top of this page. For material changes, we will notify active subscribers by email with at least 14 days notice before the changes take effect.</P>
            <P>Continued use of our service after the effective date of any update constitutes your acceptance of the revised Terms.</P>
          </PolicySection>

          <PolicySection title="16. Contact">
            <P>Questions about these Terms? Contact us at the email listed on our About page. We respond to all legal inquiries within 5 business days.</P>
          </PolicySection>
        </ContainerSm>
      </Section>
    </>
  )
}
