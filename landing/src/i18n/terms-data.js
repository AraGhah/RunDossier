function termsSectionsEn(v) {
  return [
    {
      title: '1. Agreement',
      blocks: [
        {
          type: 'p',
          text: `By accessing ${v.websiteHost} or using our services, you agree to these Terms of Service ("Terms"). If you do not agree, do not use our services.`,
        },
        {
          type: 'p',
          text: `These Terms are a binding agreement between you (or the business you represent, "Client") and ${v.entity}, operated by ${v.operator} in Canada ("we," "us," "our").`,
        },
      ],
    },
    {
      title: '2. Service description',
      blocks: [
        { type: 'p', text: `${v.entity} provides B2B prospect research and email opener personalization. We:` },
        {
          type: 'ul',
          items: [
            'Accept business prospect lists (name, company, LinkedIn URL, etc.) submitted by the Client.',
            'Research prospects using publicly available information.',
            'Produce QA-scored, research-backed email opening lines.',
            'Deliver output as a CSV compatible with the Client\'s sequencer.',
          ],
        },
        {
          type: 'p',
          text: 'We are a content and research provider. We do not send emails on your behalf, access your mailboxes, or manage outbound campaigns.',
        },
      ],
    },
    {
      title: '3. Eligibility',
      blocks: [
        { type: 'p', text: 'You must be at least 18 years old and acting for a legitimate business. You represent that:' },
        {
          type: 'ul',
          items: [
            'You have authority to bind the entity you represent.',
            'Your use of our services and deliverables will comply with applicable laws.',
            'You will not use our services where prohibited by law.',
          ],
        },
      ],
    },
    {
      title: '4. Free pilot',
      blocks: [
        { type: 'p', text: 'Our free 100-prospect pilot ("Pilot") is subject to:' },
        {
          type: 'ul',
          items: [
            'One Pilot request per business domain, unless we agree otherwise in writing.',
            'Our right to decline any Pilot request at our discretion.',
            'Delivery on an "as-is" basis with no guarantee of campaign results.',
            'No cash value; we may modify or end the Pilot offer at any time.',
          ],
        },
      ],
    },
    {
      title: '5. Paid plans and billing',
      blocks: [
        { type: 'p', text: 'Paid plans are billed monthly in advance unless otherwise agreed. You agree to:' },
        {
          type: 'ul',
          items: [
            'Provide accurate billing information.',
            'Pay fees before service delivery for each billing cycle.',
            'Accept that fees are generally non-refundable except as stated in Section 6.',
          ],
        },
        {
          type: 'p',
          text: 'We may change published pricing with at least 30 days\' notice to active subscribers. Changes apply at the next billing cycle. Custom agency pricing is governed by a separate written agreement.',
        },
        {
          type: 'p',
          text: 'All prices are in Canadian dollars unless stated otherwise. Applicable taxes (GST/HST/QST/PST) are added where required by Canadian law.',
        },
      ],
    },
    {
      title: '6. Cancellation and refunds',
      blocks: [
        {
          type: 'p',
          text: 'You may cancel before your next billing date; cancellation takes effect at the end of the current paid period. We do not provide prorated refunds for unused days unless required by applicable consumer protection law.',
        },
        {
          type: 'p',
          text: 'If we fail to deliver within the stated turnaround (24–48 hours) due to our error, you may receive a credit equal to one month\'s subscription fee. Other refunds are at our discretion for clear billing or technical errors on our side.',
        },
      ],
    },
    {
      title: '7. Client obligations — privacy and outbound compliance',
      blocks: [
        { type: 'p', text: 'As Client, you are responsible for your data and how you use our deliverables. You agree to:' },
        {
          type: 'ul',
          items: [
            'Provide accurate prospect data; we are not liable for output based on false or incomplete inputs.',
            'Comply with Canada\'s Anti-Spam Legislation (CASL) when sending commercial electronic messages to Canadian recipients — including consent, identification, and unsubscribe requirements.',
            'Comply with PIPEDA, Quebec Law 25, and applicable provincial privacy laws when collecting and using personal information about prospects.',
            'Comply with all laws in each jurisdiction you target (for example, GDPR/UK GDPR in Europe, CAN-SPAM in the United States, and local telemarketing rules).',
            'Not submit lists of private consumers (B2C), minors, or data obtained unlawfully.',
            'Not resell or sublicense our deliverables without our prior written consent.',
            'Not use our service to create deceptive, harassing, defamatory, or unlawful content.',
          ],
        },
        {
          type: 'p',
          text: `${v.entity} processes prospect data only as your service provider. You remain responsible for determining that you have a lawful basis to provide that data to us and to contact those individuals.`,
        },
      ],
    },
    {
      title: '8. Intellectual property',
      blocks: [
        {
          type: 'p',
          text: 'Upon full payment, you own the opener text we deliver and may use it in your campaigns. We retain ownership of our methodologies, QA systems, tooling, and internal processes.',
        },
        {
          type: 'p',
          text: 'Our website, brand, and design assets remain our property and may not be copied without permission.',
        },
      ],
    },
    {
      title: '9. Confidentiality',
      blocks: [
        { type: 'p', text: 'Each party will keep the other\'s confidential information confidential. Specifically:' },
        {
          type: 'ul',
          items: [
            'We will not disclose your prospect lists, campaign details, or business data except to fulfill your order, use service providers bound by confidentiality, or as required by law.',
            'You will not disclose our pricing, internal processes, or proprietary methods to competitors.',
          ],
        },
        { type: 'p', text: 'This obligation survives termination for 2 years.' },
      ],
    },
    {
      title: '10. Disclaimer of warranties',
      blocks: [
        {
          type: 'p',
          text: 'Our services are provided "as is" and "as available." To the fullest extent permitted by applicable law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
        },
        {
          type: 'p',
          text: 'We do not warrant any specific reply rate, revenue outcome, or uninterrupted service. Campaign results depend on factors outside our control.',
        },
      ],
    },
    {
      title: '11. Limitation of liability',
      blocks: [
        {
          type: 'p',
          text: 'To the maximum extent permitted by applicable law, our total liability for any claim arising from these Terms or our services shall not exceed the fees you paid us in the 3 months before the claim.',
        },
        {
          type: 'p',
          text: 'We are not liable for indirect, incidental, special, consequential, or punitive damages, including lost profits or reputational harm, even if advised of the possibility — except where such exclusion is prohibited by law (including certain consumer protection statutes in Canada).',
        },
      ],
    },
    {
      title: '12. Indemnification',
      blocks: [
        {
          type: 'p',
          text: `You agree to indemnify and hold harmless ${v.entity} and ${v.operator} from claims, damages, and reasonable legal fees arising from:`,
        },
        {
          type: 'ul',
          items: [
            'Your breach of these Terms.',
            'Your violation of CASL, PIPEDA, Law 25, or other applicable law in connection with your campaigns.',
            'Third-party claims related to emails you send using our deliverables.',
          ],
        },
      ],
    },
    {
      title: '13. Termination',
      blocks: [
        { type: 'p', text: 'We may suspend or terminate access immediately if you:' },
        {
          type: 'ul',
          items: [
            'Breach these Terms.',
            'Create legal or reputational risk through your use of our services.',
            'Have an unpaid balance more than 14 days overdue.',
          ],
        },
        {
          type: 'p',
          text: 'You may stop using our services at any time. Termination does not entitle you to a refund for prepaid periods except as in Section 6.',
        },
      ],
    },
    {
      title: '14. Governing law and disputes',
      blocks: [
        {
          type: 'p',
          text: `These Terms are governed by the laws of Canada and the ${v.jurisdiction}, without regard to conflict-of-law rules. The United Nations Convention on Contracts for the International Sale of Goods does not apply.`,
        },
        {
          type: 'p',
          segments: [
            { text: 'Before formal proceedings, both parties will attempt good-faith resolution by written notice to ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: ' for at least 30 days.' },
          ],
        },
        {
          type: 'p',
          text: `Subject to mandatory arbitration or consumer-protection rules that cannot be waived, disputes shall be brought exclusively in the courts of the ${v.jurisdiction}.`,
        },
      ],
    },
    {
      title: '15. Privacy',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: 'Our collection and use of personal information is described in our ' },
            { text: 'Privacy Policy', to: '/privacy' },
            { text: ', which forms part of these Terms.' },
          ],
        },
      ],
    },
    {
      title: '16. Changes',
      blocks: [
        {
          type: 'p',
          text: 'We may update these Terms. The "Last updated" date will change accordingly. Material changes to active subscribers will be notified by email at least 14 days before taking effect. Continued use after the effective date constitutes acceptance.',
        },
      ],
    },
    {
      title: '17. Contact',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: 'Legal or contractual questions: ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: '. We aim to respond within 5 business days.' },
          ],
        },
        {
          type: 'p',
          className: 'text-muted-2 text-xs mt-4',
          text: 'These Terms are a commercial agreement template and do not constitute legal advice. Consult a qualified lawyer for advice specific to your business.',
        },
      ],
    },
  ]
}

function termsSectionsFr(v) {
  return [
    {
      title: '1. Acceptation',
      blocks: [
        {
          type: 'p',
          text: `En accédant à ${v.websiteHost} ou en utilisant nos services, vous acceptez les présentes conditions d’utilisation (« Conditions »). Si vous n’acceptez pas, n’utilisez pas nos services.`,
        },
        {
          type: 'p',
          text: `Les présentes Conditions constituent un accord contraignant entre vous (ou l’entreprise que vous représentez, le « Client ») et ${v.entity}, exploité par ${v.operator} au Canada (« nous », « notre »).`,
        },
      ],
    },
    {
      title: '2. Description du service',
      blocks: [
        { type: 'p', text: `${v.entity} fournit la recherche de prospects B2B et la personnalisation d’accroches d’e-mail. Nous :` },
        {
          type: 'ul',
          items: [
            'Acceptons les listes de prospects professionnels (nom, entreprise, URL LinkedIn, etc.) soumises par le Client.',
            'Recherchons les prospects à partir d’informations publiques.',
            'Produisons des premières lignes d’e-mail notées QA et fondées sur la recherche.',
            'Livrons le résultat en CSV compatible avec le séquenceur du Client.',
          ],
        },
        {
          type: 'p',
          text: 'Nous sommes un fournisseur de contenu et de recherche. Nous n’envoyons pas d’e-mails en votre nom, n’accédons pas à vos boîtes mail et ne gérons pas vos campagnes outbound.',
        },
      ],
    },
    {
      title: '3. Admissibilité',
      blocks: [
        { type: 'p', text: 'Vous devez avoir au moins 18 ans et agir pour une entreprise légitime. Vous déclarez que :' },
        {
          type: 'ul',
          items: [
            'Vous avez l’autorité pour engager l’entité que vous représentez.',
            'Votre utilisation de nos services et livrables respectera les lois applicables.',
            'Vous n’utiliserez pas nos services là où la loi l’interdit.',
          ],
        },
      ],
    },
    {
      title: '4. Pilote gratuit',
      blocks: [
        { type: 'p', text: 'Notre pilote gratuit de 100 prospects (« Pilote ») est soumis aux conditions suivantes :' },
        {
          type: 'ul',
          items: [
            'Une demande de Pilote par domaine d’entreprise, sauf accord écrit contraire.',
            'Notre droit de refuser toute demande de Pilote à notre discrétion.',
            'Livraison « en l’état » sans garantie de résultats de campagne.',
            'Aucune valeur monétaire ; nous pouvons modifier ou mettre fin à l’offre Pilote à tout moment.',
          ],
        },
      ],
    },
    {
      title: '5. Forfaits payants et facturation',
      blocks: [
        { type: 'p', text: 'Les forfaits payants sont facturés mensuellement à l’avance sauf accord contraire. Vous acceptez de :' },
        {
          type: 'ul',
          items: [
            'Fournir des informations de facturation exactes.',
            'Payer les frais avant la prestation pour chaque cycle de facturation.',
            'Accepter que les frais sont généralement non remboursables sauf comme indiqué à la section 6.',
          ],
        },
        {
          type: 'p',
          text: 'Nous pouvons modifier les tarifs publiés avec un préavis d’au moins 30 jours aux abonnés actifs. Les changements s’appliquent au cycle suivant. Les tarifs agence sur mesure sont régis par un accord écrit distinct.',
        },
        {
          type: 'p',
          text: 'Tous les prix sont en dollars canadiens sauf indication contraire. Les taxes applicables (TPS/TVH/TVQ/TVP) sont ajoutées lorsque la loi canadienne l’exige.',
        },
      ],
    },
    {
      title: '6. Annulation et remboursements',
      blocks: [
        {
          type: 'p',
          text: 'Vous pouvez annuler avant votre prochaine date de facturation ; l’annulation prend effet à la fin de la période payée en cours. Nous n’accordons pas de remboursement au prorata des jours non utilisés sauf si la loi sur la protection des consommateurs l’exige.',
        },
        {
          type: 'p',
          text: 'Si nous ne livrons pas dans le délai annoncé (24–48 h) en raison d’une erreur de notre part, vous pouvez recevoir un crédit équivalent à un mois d’abonnement. Les autres remboursements sont à notre discrétion en cas d’erreur de facturation ou technique manifeste de notre côté.',
        },
      ],
    },
    {
      title: '7. Obligations du Client — confidentialité et conformité outbound',
      blocks: [
        { type: 'p', text: 'En tant que Client, vous êtes responsable de vos données et de l’usage de nos livrables. Vous acceptez de :' },
        {
          type: 'ul',
          items: [
            'Fournir des données prospects exactes ; nous ne sommes pas responsables des livrables basés sur des entrées fausses ou incomplètes.',
            'Respecter la Loi canadienne anti-pourriel (LCAP) pour les messages électroniques commerciaux aux destinataires canadiens — consentement, identification et désabonnement inclus.',
            'Respecter la LPRPDE, la Loi 25 du Québec et les lois provinciales applicables lors de la collecte et de l’utilisation de renseignements personnels sur les prospects.',
            'Respecter toutes les lois dans chaque juridiction ciblée (par exemple RGPD/UK GDPR en Europe, CAN-SPAM aux États-Unis et règles locales de télémarketing).',
            'Ne pas soumettre de listes de consommateurs (B2C), de mineurs ou de données obtenues illicitement.',
            'Ne pas revendre ni sous-licencier nos livrables sans notre consentement écrit préalable.',
            'Ne pas utiliser notre service pour créer du contenu trompeur, harcelant, diffamatoire ou illégal.',
          ],
        },
        {
          type: 'p',
          text: `${v.entity} traite les données prospects uniquement en tant que votre fournisseur de services. Vous demeurez responsable de déterminer que vous avez une base légale pour nous fournir ces données et pour contacter ces personnes.`,
        },
      ],
    },
    {
      title: '8. Propriété intellectuelle',
      blocks: [
        {
          type: 'p',
          text: 'Après paiement intégral, vous possédez le texte des accroches livrées et pouvez l’utiliser dans vos campagnes. Nous conservons la propriété de nos méthodologies, systèmes QA, outils et processus internes.',
        },
        {
          type: 'p',
          text: 'Notre site, marque et éléments de design demeurent notre propriété et ne peuvent être copiés sans autorisation.',
        },
      ],
    },
    {
      title: '9. Confidentialité',
      blocks: [
        { type: 'p', text: 'Chaque partie gardera confidentielles les informations confidentielles de l’autre. Notamment :' },
        {
          type: 'ul',
          items: [
            'Nous ne divulguerons pas vos listes de prospects, détails de campagne ou données d’affaires sauf pour exécuter votre commande, faire appel à des fournisseurs liés par confidentialité ou si la loi l’exige.',
            'Vous ne divulguerez pas nos tarifs, processus internes ou méthodes propriétaires à des concurrents.',
          ],
        },
        { type: 'p', text: 'Cette obligation survit à la résiliation pendant 2 ans.' },
      ],
    },
    {
      title: '10. Exclusion de garanties',
      blocks: [
        {
          type: 'p',
          text: 'Nos services sont fournis « en l’état » et « selon disponibilité ». Dans toute la mesure permise par la loi applicable, nous excluons toute garantie, expresse ou implicite, y compris la qualité marchande, l’adéquation à un usage particulier et l’absence de contrefaçon.',
        },
        {
          type: 'p',
          text: 'Nous ne garantissons aucun taux de réponse, résultat de revenu ou service ininterrompu. Les résultats de campagne dépendent de facteurs hors de notre contrôle.',
        },
      ],
    },
    {
      title: '11. Limitation de responsabilité',
      blocks: [
        {
          type: 'p',
          text: 'Dans la mesure maximale permise par la loi applicable, notre responsabilité totale pour toute réclamation découlant des présentes Conditions ou de nos services ne dépassera pas les frais que vous nous avez payés au cours des 3 mois précédant la réclamation.',
        },
        {
          type: 'p',
          text: 'Nous ne sommes pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, y compris perte de profits ou atteinte à la réputation, même si nous avons été informés de cette possibilité — sauf lorsque une telle exclusion est interdite par la loi (y compris certaines lois de protection des consommateurs au Canada).',
        },
      ],
    },
    {
      title: '12. Indemnisation',
      blocks: [
        {
          type: 'p',
          text: `Vous acceptez d’indemniser et de dégager de toute responsabilité ${v.entity} et ${v.operator} pour les réclamations, dommages et honoraires juridiques raisonnables découlant de :`,
        },
        {
          type: 'ul',
          items: [
            'Votre violation des présentes Conditions.',
            'Votre violation de la LCAP, de la LPRPDE, de la Loi 25 ou d’autres lois applicables dans le cadre de vos campagnes.',
            'Les réclamations de tiers liées aux e-mails que vous envoyez en utilisant nos livrables.',
          ],
        },
      ],
    },
    {
      title: '13. Résiliation',
      blocks: [
        { type: 'p', text: 'Nous pouvons suspendre ou résilier l’accès immédiatement si vous :' },
        {
          type: 'ul',
          items: [
            'Violer les présentes Conditions.',
            'Créer un risque juridique ou réputationnel par votre utilisation de nos services.',
            'Avoir un solde impayé depuis plus de 14 jours.',
          ],
        },
        {
          type: 'p',
          text: 'Vous pouvez cesser d’utiliser nos services à tout moment. La résiliation ne vous donne pas droit à un remboursement des périodes prépayées sauf comme prévu à la section 6.',
        },
      ],
    },
    {
      title: '14. Droit applicable et litiges',
      blocks: [
        {
          type: 'p',
          text: `Les présentes Conditions sont régies par les lois du Canada et de ${v.jurisdiction}, sans égard aux règles de conflit de lois. La Convention des Nations Unies sur les contrats de vente internationale de marchandises ne s’applique pas.`,
        },
        {
          type: 'p',
          segments: [
            { text: 'Avant toute procédure formelle, les parties tenteront une résolution de bonne foi par avis écrit à ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: ' pendant au moins 30 jours.' },
          ],
        },
        {
          type: 'p',
          text: `Sous réserve des règles d’arbitrage obligatoire ou de protection des consommateurs qui ne peuvent être exclues, les litiges seront portés exclusivement devant les tribunaux de ${v.jurisdiction}.`,
        },
      ],
    },
    {
      title: '15. Confidentialité des données',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: 'Notre collecte et utilisation des renseignements personnels sont décrites dans notre ' },
            { text: 'Politique de confidentialité', to: '/privacy' },
            { text: ', qui fait partie intégrante des présentes Conditions.' },
          ],
        },
      ],
    },
    {
      title: '16. Modifications',
      blocks: [
        {
          type: 'p',
          text: 'Nous pouvons mettre à jour les présentes Conditions. La date « Dernière mise à jour » sera modifiée en conséquence. Les changements importants pour les abonnés actifs seront notifiés par e-mail au moins 14 jours avant leur entrée en vigueur. L’utilisation continue après cette date vaut acceptation.',
        },
      ],
    },
    {
      title: '17. Contact',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: 'Questions juridiques ou contractuelles : ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: '. Nous visons une réponse sous 5 jours ouvrables.' },
          ],
        },
        {
          type: 'p',
          className: 'text-muted-2 text-xs mt-4',
          text: 'Les présentes Conditions constituent un modèle d’accord commercial et ne constituent pas un avis juridique. Consultez un avocat qualifié pour des conseils adaptés à votre entreprise.',
        },
      ],
    },
  ]
}

const TERMS_META = {
  en: {
    eyebrow: 'Legal',
    lastUpdatedLabel: 'Last updated:',
    intro: (v) =>
      `These Terms of Service govern your use of ${v.websiteHost} and the Dossier personalized outbound opener service operated by ${v.operator} in ${v.city}, Canada. By submitting a pilot request or using our deliverables, you agree to these Terms.`,
    faqEyebrow: 'Terms FAQ',
    faqTitle: 'Common terms questions',
  },
  fr: {
    eyebrow: 'Juridique',
    lastUpdatedLabel: 'Dernière mise à jour :',
    intro: (v) =>
      `Les présentes conditions d’utilisation régissent votre usage de ${v.websiteHost} et du service d’accroches outbound personnalisées Dossier exploité par ${v.operator} à ${v.city}, Canada. En soumettant une demande pilote ou en utilisant nos livrables, vous acceptez ces conditions.`,
    faqEyebrow: 'FAQ conditions',
    faqTitle: 'Questions fréquentes sur les conditions',
  },
}

export function getTermsContent(lang, vars) {
  const meta = TERMS_META[lang === 'fr' ? 'fr' : 'en']
  const sections = lang === 'fr' ? termsSectionsFr(vars) : termsSectionsEn(vars)
  return { ...meta, sections, intro: meta.intro(vars) }
}
