import { motion } from 'framer-motion'
import { Section, ContainerSm, Eyebrow, fadeUp } from '../components/ui'
import {
  LEGAL_ENTITY,
  LEGAL_OPERATOR,
  LEGAL_WEBSITE,
  LEGAL_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_JURISDICTION,
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
            <p className="text-muted text-sm">Last updated: {LEGAL_LAST_UPDATED}</p>
          </motion.div>

          <PolicySection title="1. Agreement">
            <P>
              By accessing {LEGAL_WEBSITE.replace('https://', '')} or using our services, you agree to these Terms of
              Service (&quot;Terms&quot;). If you do not agree, do not use our services.
            </P>
            <P>
              These Terms are a binding agreement between you (or the business you represent, &quot;Client&quot;) and{' '}
              {LEGAL_ENTITY}, operated by {LEGAL_OPERATOR} in Canada (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;).
            </P>
          </PolicySection>

          <PolicySection title="2. Service description">
            <P>{LEGAL_ENTITY} provides B2B prospect research and email opener personalization. We:</P>
            <Ul items={[
              'Accept business prospect lists (name, company, LinkedIn URL, etc.) submitted by the Client.',
              'Research prospects using publicly available information.',
              'Produce QA-scored, research-backed email opening lines.',
              'Deliver output as a CSV compatible with the Client\'s sequencer.',
            ]} />
            <P>
              We are a content and research provider. We do not send emails on your behalf, access your mailboxes,
              or manage outbound campaigns.
            </P>
          </PolicySection>

          <PolicySection title="3. Eligibility">
            <P>You must be at least 18 years old and acting for a legitimate business. You represent that:</P>
            <Ul items={[
              'You have authority to bind the entity you represent.',
              'Your use of our services and deliverables will comply with applicable laws.',
              'You will not use our services where prohibited by law.',
            ]} />
          </PolicySection>

          <PolicySection title="4. Free pilot">
            <P>Our free 100-prospect pilot (&quot;Pilot&quot;) is subject to:</P>
            <Ul items={[
              'One Pilot request per business domain, unless we agree otherwise in writing.',
              'Our right to decline any Pilot request at our discretion.',
              'Delivery on an &quot;as-is&quot; basis with no guarantee of campaign results.',
              'No cash value; we may modify or end the Pilot offer at any time.',
            ]} />
          </PolicySection>

          <PolicySection title="5. Paid plans and billing">
            <P>Paid plans are billed monthly in advance unless otherwise agreed. You agree to:</P>
            <Ul items={[
              'Provide accurate billing information.',
              'Pay fees before service delivery for each billing cycle.',
              'Accept that fees are generally non-refundable except as stated in Section 6.',
            ]} />
            <P>
              We may change published pricing with at least 30 days&apos; notice to active subscribers. Changes
              apply at the next billing cycle. Custom agency pricing is governed by a separate written agreement.
            </P>
            <P>
              All prices are in Canadian dollars unless stated otherwise. Applicable taxes (GST/HST/QST/PST) are
              added where required by Canadian law.
            </P>
          </PolicySection>

          <PolicySection title="6. Cancellation and refunds">
            <P>
              You may cancel before your next billing date; cancellation takes effect at the end of the current
              paid period. We do not provide prorated refunds for unused days unless required by applicable
              consumer protection law.
            </P>
            <P>
              If we fail to deliver within the stated turnaround (24–48 hours) due to our error, you may receive a
              credit equal to one month&apos;s subscription fee. Other refunds are at our discretion for clear
              billing or technical errors on our side.
            </P>
          </PolicySection>

          <PolicySection title="7. Client obligations — privacy and outbound compliance">
            <P>As Client, you are responsible for your data and how you use our deliverables. You agree to:</P>
            <Ul items={[
              'Provide accurate prospect data; we are not liable for output based on false or incomplete inputs.',
              'Comply with Canada\'s Anti-Spam Legislation (CASL) when sending commercial electronic messages to Canadian recipients — including consent, identification, and unsubscribe requirements.',
              'Comply with PIPEDA, Quebec Law 25, and applicable provincial privacy laws when collecting and using personal information about prospects.',
              'Comply with all laws in each jurisdiction you target (for example, GDPR/UK GDPR in Europe, CAN-SPAM in the United States, and local telemarketing rules).',
              'Not submit lists of private consumers (B2C), minors, or data obtained unlawfully.',
              'Not resell or sublicense our deliverables without our prior written consent.',
              'Not use our service to create deceptive, harassing, defamatory, or unlawful content.',
            ]} />
            <P>
              {LEGAL_ENTITY} processes prospect data only as your service provider. You remain responsible for
              determining that you have a lawful basis to provide that data to us and to contact those individuals.
            </P>
          </PolicySection>

          <PolicySection title="8. Intellectual property">
            <P>
              Upon full payment, you own the opener text we deliver and may use it in your campaigns. We retain
              ownership of our methodologies, QA systems, tooling, and internal processes.
            </P>
            <P>
              Our website, brand, and design assets remain our property and may not be copied without permission.
            </P>
          </PolicySection>

          <PolicySection title="9. Confidentiality">
            <P>Each party will keep the other&apos;s confidential information confidential. Specifically:</P>
            <Ul items={[
              'We will not disclose your prospect lists, campaign details, or business data except to fulfill your order, use service providers bound by confidentiality, or as required by law.',
              'You will not disclose our pricing, internal processes, or proprietary methods to competitors.',
            ]} />
            <P>This obligation survives termination for 2 years.</P>
          </PolicySection>

          <PolicySection title="10. Disclaimer of warranties">
            <P>
              Our services are provided &quot;as is&quot; and &quot;as available.&quot; To the fullest extent
              permitted by applicable law, we disclaim all warranties, express or implied, including merchantability,
              fitness for a particular purpose, and non-infringement.
            </P>
            <P>We do not warrant any specific reply rate, revenue outcome, or uninterrupted service. Campaign
              results depend on factors outside our control.</P>
          </PolicySection>

          <PolicySection title="11. Limitation of liability">
            <P>
              To the maximum extent permitted by applicable law, our total liability for any claim arising from
              these Terms or our services shall not exceed the fees you paid us in the 3 months before the claim.
            </P>
            <P>
              We are not liable for indirect, incidental, special, consequential, or punitive damages, including
              lost profits or reputational harm, even if advised of the possibility — except where such exclusion
              is prohibited by law (including certain consumer protection statutes in Canada).
            </P>
          </PolicySection>

          <PolicySection title="12. Indemnification">
            <P>You agree to indemnify and hold harmless {LEGAL_ENTITY} and {LEGAL_OPERATOR} from claims, damages,
              and reasonable legal fees arising from:</P>
            <Ul items={[
              'Your breach of these Terms.',
              'Your violation of CASL, PIPEDA, Law 25, or other applicable law in connection with your campaigns.',
              'Third-party claims related to emails you send using our deliverables.',
            ]} />
          </PolicySection>

          <PolicySection title="13. Termination">
            <P>We may suspend or terminate access immediately if you:</P>
            <Ul items={[
              'Breach these Terms.',
              'Create legal or reputational risk through your use of our services.',
              'Have an unpaid balance more than 14 days overdue.',
            ]} />
            <P>
              You may stop using our services at any time. Termination does not entitle you to a refund for prepaid
              periods except as in Section 6.
            </P>
          </PolicySection>

          <PolicySection title="14. Governing law and disputes">
            <P>
              These Terms are governed by the laws of Canada and the {LEGAL_JURISDICTION}, without regard to
              conflict-of-law rules. The United Nations Convention on Contracts for the International Sale of
              Goods does not apply.
            </P>
            <P>
              Before formal proceedings, both parties will attempt good-faith resolution by written notice to{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-navy hover:underline">{LEGAL_EMAIL}</a> for at
              least 30 days.
            </P>
            <P>
              Subject to mandatory arbitration or consumer-protection rules that cannot be waived, disputes shall
              be brought exclusively in the courts of the {LEGAL_JURISDICTION}.
            </P>
          </PolicySection>

          <PolicySection title="15. Privacy">
            <P>
              Our collection and use of personal information is described in our{' '}
              <a href="/privacy" className="text-navy hover:underline">Privacy Policy</a>, which forms part of
              these Terms.
            </P>
          </PolicySection>

          <PolicySection title="16. Changes">
            <P>
              We may update these Terms. The &quot;Last updated&quot; date will change accordingly. Material changes
              to active subscribers will be notified by email at least 14 days before taking effect. Continued use
              after the effective date constitutes acceptance.
            </P>
          </PolicySection>

          <PolicySection title="17. Contact">
            <P>
              Legal or contractual questions:{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-navy hover:underline">{LEGAL_EMAIL}</a>.
              We aim to respond within 5 business days.
            </P>
            <P className="text-muted-2 text-xs mt-4">
              These Terms are a commercial agreement template and do not constitute legal advice. Consult a
              qualified lawyer for advice specific to your business.
            </P>
          </PolicySection>
        </ContainerSm>
      </Section>
    </>
  )
}
