/** @typedef {{ entity: string, operator: string, website: string, websiteHost: string, email: string, city: string, bookCallUrl: string }} LegalVars */

function privacySectionsEn(v) {
  return [
    {
      title: '1. Who we are',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: `${v.entity} ("we," "us," or "our") is a B2B prospect research and email-personalization service operated by ${v.operator}, based in Canada. Our website is ` },
            { text: v.websiteHost, href: v.website },
            { text: '.' }],
        },
        {
          type: 'p',
          segments: [
            { text: 'This Privacy Policy describes how we collect, use, disclose, and protect personal information in accordance with Canadian privacy law, including the ' },
            { text: 'Personal Information Protection and Electronic Documents Act', em: true },
            { text: ' (PIPEDA), and, where applicable, Quebec\'s ' },
            { text: 'Act respecting the protection of personal information in the private sector', em: true },
            { text: ' (Law 25), Alberta\'s Personal Information Protection Act (PIPA), and British Columbia\'s Personal Information Protection Act (PIPA).' }],
        },
        {
          type: 'p',
          segments: [
            { text: 'Privacy inquiries and requests: ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: '.' }],
        }],
    },
    {
      title: '2. What personal information we collect',
      blocks: [
        {
          type: 'p',
          text: 'We collect personal information in three categories: (1) Contact data you provide — name, work email address, company name, sequencer platform, and message text — via our intake form, email (ara@getdossier.co), or Cal.com booking; retained up to 12 months after last contact. (2) Prospect CSV files you upload — rows containing prospect names, job titles, company names, LinkedIn profile URLs, and business email addresses — used only to fulfill your order and deleted within 90 days of delivery. (3) Technical data — IP address, browser type, device type, approximate region, and pages visited — from Cloudflare server logs; retained up to 90 days.',
        },
        { type: 'h3', text: 'Information you provide' },
        {
          type: 'ul',
          items: [
            'Name, work email address, company name, and sequencer platform when you submit the free pilot form.',
            'LinkedIn profile URL or website URL submitted with a pilot request.',
            'Name, email, and scheduling details when you book a call through Cal.com.',
            'Messages you send us by email or through our contact channels.',
            'Billing and account information for paid plans (payment card data is handled by our payment processor, not stored by us).'],
        },
        { type: 'h3', text: 'Prospect data you upload (about third parties)' },
        {
          type: 'ul',
          items: [
            'CSV files or lists containing business prospect names, job titles, companies, LinkedIn URLs, and related business contact data.',
            'This information relates to your prospects, not to you. We treat it as confidential client data and use it only to fulfill your order.',
            'You are responsible for having a lawful basis to provide this data to us and to use our deliverables (see our Terms of Service).'],
        },
        { type: 'h3', text: 'Technical information' },
        {
          type: 'ul',
          items: [
            'IP address, browser type, device type, and approximate region from web server logs.',
            'Pages visited and referral source, if we use privacy-respecting analytics.'],
        }],
    },
    {
      title: '3. How we use personal information',
      blocks: [
        { type: 'p', text: 'We use personal information for legitimate business purposes, including:' },
        {
          type: 'ul',
          items: [
            'Delivering your order: researching prospects, writing openers, and returning CSV deliverables.',
            'Communicating about your order, pilot request, or account.',
            'Processing payments and preventing fraud.',
            'Sending transactional messages (confirmations, delivery notices, scheduling updates).',
            'Improving service quality using aggregated, non-identifying feedback.',
            'Complying with legal obligations and responding to lawful requests.'],
        },
        {
          type: 'p',
          text: 'We do not sell personal information. We do not use your prospect lists for any purpose other than fulfilling your order. We do not run advertising retargeting or sell data to data brokers.',
        }],
    },
    {
      title: '4. Consent and legal authority (PIPEDA)',
      blocks: [
        {
          type: 'p',
          text: 'Under PIPEDA, we collect, use, and disclose personal information with your knowledge and consent, except where the law permits or requires otherwise. In practice:',
        },
        {
          type: 'ul',
          items: [
            'When you submit a form, book a call, or purchase a plan, you consent to the collection and use described in this policy for that purpose.',
            'We may rely on implied consent for follow-up communications directly related to a request you initiated.',
            'For commercial electronic messages (marketing email), we follow Canada\'s Anti-Spam Legislation (CASL) and obtain express consent where required, or rely on a permitted form of implied consent (for example, an existing business relationship). Every marketing message includes identification and an unsubscribe mechanism.',
            'We may process information without consent where required or authorized by law (for example, fraud prevention or responding to a court order).'],
        }],
    },
    {
      title: '5. Cookies and website analytics',
      blocks: [
        {
          type: 'p',
          text: 'Our site may set strictly necessary cookies required for security and basic operation (for example, session or anti-abuse tokens on forms).',
        },
        {
          type: 'p',
          text: 'If we use optional analytics cookies or similar technologies, we will describe them here and, where required by Canadian or provincial law, obtain your consent before activating non-essential tracking. We do not use Google Analytics advertising features or ad-retargeting pixels.',
        }],
    },
    {
      title: '6. Service providers and cross-border processing',
      blocks: [
        {
          type: 'p',
          text: 'We use trusted third-party providers to operate our business. Some may process data outside Canada (including in the United States). Under PIPEDA, we remain accountable for personal information transferred to service providers and require protections comparable to Canadian standards.',
        },
        {
          type: 'ul',
          items: [
            'Cal.com, scheduling; processes name and email when you book a call.',
            'Cloudflare, website hosting and security (Pages, CDN).',
            'Payment processor (e.g. Stripe), billing; we do not store full payment card numbers.',
            'Email delivery provider, transactional email.',
            'Anthropic, AI processing for research and opener generation on prospect data you submit.',
            'Apify, automated retrieval of publicly available LinkedIn profile information for research.',
            'Database hosting, secure storage of order and account records.'],
        },
        {
          type: 'p',
          text: 'Each provider maintains its own privacy policy. We share only what is necessary for them to perform services on our behalf.',
        }],
    },
    {
      title: '7. Retention',
      blocks: [
        { type: 'p', text: 'We keep personal information only as long as needed for the purposes described above:' },
        {
          type: 'ul',
          items: [
            'Order data and prospect CSVs: up to 90 days after delivery, then securely deleted unless you request earlier deletion or a longer period is agreed in writing.',
            'Pilot intake records: up to 12 months after last contact, unless you request deletion sooner.',
            'Billing and tax records: up to 7 years, as required under Canadian tax and commercial record-keeping rules.',
            'Server logs: typically up to 90 days, unless needed for security investigations.'],
        }],
    },
    {
      title: '8. Safeguards',
      blocks: [
        { type: 'p', text: 'We apply reasonable administrative, technical, and physical safeguards, including:' },
        {
          type: 'ul',
          items: [
            'HTTPS/TLS encryption in transit.',
            'Access controls limiting prospect data to personnel fulfilling your order.',
            'No public storage of client prospect files.',
            'PCI-compliant payment processing, card numbers are not stored on our servers.'],
        },
        {
          type: 'p',
          text: 'No method of transmission or storage is completely secure. If a breach creates a real risk of significant harm to you, we will notify you and, where required, the Office of the Privacy Commissioner of Canada and/or the Commission d\'accès à l\'information du Québec, in line with applicable law.',
        }],
    },
    {
      title: '9. Your rights',
      blocks: [
        { type: 'p', text: 'Depending on where you live in Canada, you may have the right to:' },
        {
          type: 'ul',
          items: [
            'Access the personal information we hold about you.',
            'Request correction of inaccurate or incomplete information.',
            'Request deletion, subject to legal retention obligations.',
            'Withdraw consent to optional processing (for example, marketing), without affecting prior lawful processing.',
            'Receive information about how your data is used and with whom it is shared.'],
        },
        {
          type: 'p',
          text: 'Quebec residents may have additional rights under Law 25, including data portability in certain circumstances and the right to request cessation of dissemination in specific cases.',
        },
        {
          type: 'p',
          segments: [
            { text: 'To exercise your rights, email ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: '. We will respond within 30 days (or the shorter period required by applicable provincial law). We may need to verify your identity before fulfilling a request.' }],
        },
        { type: 'p', text: 'If you are not satisfied with our response, you may contact:' },
        {
          type: 'ul',
          items: [
            'Office of the Privacy Commissioner of Canada (federal): priv.gc.ca',
            'Commission d\'accès à l\'information du Québec (Quebec): cai.gouv.qc.ca',
            'Office of the Information and Privacy Commissioner of Alberta (Alberta): oipc.ab.ca',
            'Office of the Information and Privacy Commissioner for British Columbia (BC): oipc.bc.ca'],
        }],
    },
    {
      title: '10. International visitors',
      blocks: [
        {
          type: 'p',
          text: 'Our service is offered from Canada. If you access our website from outside Canada, your information may be transferred to and processed in Canada and in other countries where our service providers operate. By using our service, you acknowledge that protections may differ from those in your country. Where GDPR or UK GDPR applies to you in addition to Canadian law, we process your data on bases including contract performance, legitimate interests, legal obligation, and consent where required.',
        }],
    },
    {
      title: '11. Children',
      blocks: [
        {
          type: 'p',
          text: 'Our service is directed at businesses and professionals. We do not knowingly collect personal information from anyone under 18. If you believe we have collected such information, contact us and we will delete it promptly.',
        }],
    },
    {
      title: '12. Changes',
      blocks: [
        {
          type: 'p',
          text: 'We may update this Privacy Policy from time to time. The "Last updated" date at the top will change when we do. Material changes will be communicated to active clients by email or a prominent notice on our website.',
        }],
    },
    {
      title: '13. Contact',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: 'Questions or complaints about privacy: ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: `. You may also book a call through our scheduling page at ${v.bookCallUrl}.` }],
        },
        {
          type: 'p',
          className: 'text-muted-2 text-xs mt-4',
          text: 'This policy is provided for transparency and does not constitute legal advice. Consult qualified counsel for advice specific to your situation.',
        }],
    }]
}

function privacySectionsFr(v) {
  return [
    {
      title: '1. Qui nous sommes',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: `${v.entity} (« nous », « notre ») est un service de recherche de prospects B2B et de personnalisation d’e-mails exploité par ${v.operator}, basé au Canada. Notre site est ` },
            { text: v.websiteHost, href: v.website },
            { text: '.' }],
        },
        {
          type: 'p',
          segments: [
            { text: 'La présente politique de confidentialité décrit comment nous collectons, utilisons, divulguons et protégeons les renseignements personnels conformément au droit canadien en matière de vie privée, notamment la ' },
            { text: 'Loi sur la protection des renseignements personnels et les documents électroniques', em: true },
            { text: ' (LPRPDE), et, le cas échéant, la ' },
            { text: 'Loi sur la protection des renseignements personnels dans le secteur privé', em: true },
            { text: ' du Québec (Loi 25), la Personal Information Protection Act (PIPA) de l’Alberta et la Personal Information Protection Act (PIPA) de la Colombie-Britannique.' }],
        },
        {
          type: 'p',
          segments: [
            { text: 'Demandes et questions relatives à la confidentialité : ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: '.' }],
        }],
    },
    {
      title: '2. Quels renseignements personnels nous collectons',
      blocks: [
        {
          type: 'p',
          text: 'Nous collectons des renseignements personnels en trois catégories : (1) Coordonnées que vous fournissez — nom, adresse e-mail professionnelle, entreprise, outil de séquence et texte du message — via notre formulaire, courriel (ara@getdossier.co) ou Cal.com ; conservées jusqu'à 12 mois après le dernier contact. (2) CSV de prospects que vous téléversez — lignes contenant noms, titres de poste, entreprises, URL LinkedIn et e-mails professionnels des prospects — utilisées uniquement pour exécuter votre commande et supprimées sous 90 jours après livraison. (3) Données techniques — adresse IP, type de navigateur, type d'appareil, région approximative et pages visitées — depuis les journaux serveur Cloudflare ; conservées jusqu'à 90 jours.',
        },
        { type: 'h3', text: 'Renseignements que vous fournissez' },
        {
          type: 'ul',
          items: [
            'Nom, adresse e-mail professionnelle, nom de l’entreprise et outil de séquence lorsque vous soumettez le formulaire pilote gratuit.',
            'URL de profil LinkedIn ou URL de site web soumise avec une demande pilote.',
            'Nom, e-mail et détails de planification lorsque vous réservez un appel via Cal.com.',
            'Messages que vous nous envoyez par e-mail ou via nos canaux de contact.',
            'Renseignements de facturation et de compte pour les forfaits payants (les données de carte sont traitées par notre processeur de paiement, pas stockées par nous).'],
        },
        { type: 'h3', text: 'Données prospects que vous téléversez (concernant des tiers)' },
        {
          type: 'ul',
          items: [
            'Fichiers CSV ou listes contenant noms de prospects, titres de poste, entreprises, URL LinkedIn et coordonnées professionnelles connexes.',
            'Ces renseignements concernent vos prospects, pas vous. Nous les traitons comme des données client confidentielles et les utilisons uniquement pour exécuter votre commande.',
            'Vous êtes responsable d’avoir une base légale pour nous fournir ces données et pour utiliser nos livrables (voir nos Conditions d’utilisation).'],
        },
        { type: 'h3', text: 'Renseignements techniques' },
        {
          type: 'ul',
          items: [
            'Adresse IP, type de navigateur, type d’appareil et région approximative à partir des journaux serveur.',
            'Pages visitées et source de référence, si nous utilisons des analyses respectueuses de la vie privée.'],
        }],
    },
    {
      title: '3. Comment nous utilisons les renseignements personnels',
      blocks: [
        { type: 'p', text: 'Nous utilisons les renseignements personnels à des fins commerciales légitimes, notamment :' },
        {
          type: 'ul',
          items: [
            'Exécuter votre commande : rechercher les prospects, rédiger les accroches et livrer les CSV.',
            'Communiquer au sujet de votre commande, demande pilote ou compte.',
            'Traiter les paiements et prévenir la fraude.',
            'Envoyer des messages transactionnels (confirmations, avis de livraison, mises à jour de planification).',
            'Améliorer la qualité du service à partir de retours agrégés et non identifiants.',
            'Respecter les obligations légales et répondre aux demandes légitimes.'],
        },
        {
          type: 'p',
          text: 'Nous ne vendons pas de renseignements personnels. Nous n’utilisons pas vos listes de prospects à d’autres fins que l’exécution de votre commande. Nous ne faisons pas de reciblage publicitaire ni ne vendons de données à des courtiers.',
        }],
    },
    {
      title: '4. Consentement et fondement juridique (LPRPDE)',
      blocks: [
        {
          type: 'p',
          text: 'En vertu de la LPRPDE, nous collectons, utilisons et divulguons les renseignements personnels avec votre consentement et votre connaissance, sauf lorsque la loi le permet ou l’exige autrement. En pratique :',
        },
        {
          type: 'ul',
          items: [
            'Lorsque vous soumettez un formulaire, réservez un appel ou achetez un forfait, vous consentez à la collecte et à l’utilisation décrites dans la présente politique pour cette fin.',
            'Nous pouvons nous appuyer sur un consentement implicite pour les suivis directement liés à une demande que vous avez initiée.',
            'Pour les messages électroniques commerciaux, nous respectons la Loi canadienne anti-pourriel (LCAP) et obtenons un consentement exprès lorsque requis, ou nous appuyons sur une forme de consentement implicite permise (par exemple, une relation d’affaires existante). Chaque message marketing inclut une identification et un mécanisme de désabonnement.',
            'Nous pouvons traiter des renseignements sans consentement lorsque la loi l’exige ou l’autorise (par exemple, prévention de la fraude ou réponse à une ordonnance judiciaire).'],
        }],
    },
    {
      title: '5. Témoins (cookies) et analyses web',
      blocks: [
        {
          type: 'p',
          text: 'Notre site peut déposer des témoins strictement nécessaires à la sécurité et au fonctionnement de base (par exemple, jetons de session ou anti-abus sur les formulaires).',
        },
        {
          type: 'p',
          text: 'Si nous utilisons des témoins d’analyse facultatifs ou des technologies similaires, nous les décrirons ici et, lorsque la loi canadienne ou provinciale l’exige, obtiendrons votre consentement avant d’activer un suivi non essentiel. Nous n’utilisons pas les fonctions publicitaires de Google Analytics ni de pixels de reciblage.',
        }],
    },
    {
      title: '6. Fournisseurs de services et traitement transfrontalier',
      blocks: [
        {
          type: 'p',
          text: 'Nous faisons appel à des fournisseurs tiers de confiance pour exploiter notre activité. Certains peuvent traiter des données hors du Canada (y compris aux États-Unis). En vertu de la LPRPDE, nous demeurons responsables des renseignements personnels transférés à des fournisseurs et exigeons des protections comparables aux normes canadiennes.',
        },
        {
          type: 'ul',
          items: [
            'Cal.com, planification ; traite nom et e-mail lorsque vous réservez un appel.',
            'Cloudflare, hébergement et sécurité du site (Pages, CDN).',
            'Processeur de paiement (p. ex. Stripe), facturation ; nous ne stockons pas les numéros de carte complets.',
            'Fournisseur d’envoi d’e-mails, courriels transactionnels.',
            'Anthropic, traitement IA pour la recherche et la génération d’accroches sur les données prospects que vous soumettez.',
            'Apify, récupération automatisée d’informations publiques de profils LinkedIn pour la recherche.',
            'Hébergement de base de données, stockage sécurisé des commandes et comptes.'],
        },
        {
          type: 'p',
          text: 'Chaque fournisseur maintient sa propre politique de confidentialité. Nous ne partageons que ce qui est nécessaire pour qu’il exécute des services pour notre compte.',
        }],
    },
    {
      title: '7. Conservation',
      blocks: [
        { type: 'p', text: 'Nous conservons les renseignements personnels uniquement le temps nécessaire aux fins décrites ci-dessus :' },
        {
          type: 'ul',
          items: [
            'Données de commande et CSV prospects : jusqu’à 90 jours après livraison, puis suppression sécurisée sauf demande de suppression anticipée ou période plus longue convenue par écrit.',
            'Dossiers d’admission pilote : jusqu’à 12 mois après le dernier contact, sauf demande de suppression plus tôt.',
            'Dossiers de facturation et fiscaux : jusqu’à 7 ans, conformément aux règles canadiennes de conservation commerciale et fiscale.',
            'Journaux serveur : généralement jusqu’à 90 jours, sauf besoin pour des enquêtes de sécurité.'],
        }],
    },
    {
      title: '8. Mesures de protection',
      blocks: [
        { type: 'p', text: 'Nous appliquons des mesures administratives, techniques et physiques raisonnables, notamment :' },
        {
          type: 'ul',
          items: [
            'Chiffrement HTTPS/TLS en transit.',
            'Contrôles d’accès limitant les données prospects au personnel exécutant votre commande.',
            'Aucun stockage public des fichiers prospects clients.',
            'Traitement des paiements conforme PCI, les numéros de carte ne sont pas stockés sur nos serveurs.'],
        },
        {
          type: 'p',
          text: 'Aucune méthode de transmission ou de stockage n’est totalement sécurisée. Si une violation crée un risque réel de préjudice important pour vous, nous vous en informerons et, lorsque requis, le Commissariat à la protection de la vie privée du Canada et/ou la Commission d’accès à l’information du Québec, conformément à la loi applicable.',
        }],
    },
    {
      title: '9. Vos droits',
      blocks: [
        { type: 'p', text: 'Selon votre province de résidence au Canada, vous pouvez avoir le droit de :' },
        {
          type: 'ul',
          items: [
            'Accéder aux renseignements personnels que nous détenons à votre sujet.',
            'Demander la correction de renseignements inexacts ou incomplets.',
            'Demander la suppression, sous réserve des obligations légales de conservation.',
            'Retirer votre consentement au traitement facultatif (par exemple, marketing), sans affecter le traitement licite antérieur.',
            'Recevoir des informations sur l’utilisation de vos données et les tiers avec qui elles sont partagées.'],
        },
        {
          type: 'p',
          text: 'Les résidents du Québec peuvent avoir des droits supplémentaires en vertu de la Loi 25, notamment la portabilité des données dans certains cas et le droit de demander la cessation de diffusion dans des situations précises.',
        },
        {
          type: 'p',
          segments: [
            { text: 'Pour exercer vos droits, écrivez à ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: '. Nous répondrons sous 30 jours (ou le délai plus court exigé par la loi provinciale applicable). Nous pouvons devoir vérifier votre identité avant de traiter une demande.' }],
        },
        { type: 'p', text: 'Si vous n’êtes pas satisfait de notre réponse, vous pouvez contacter :' },
        {
          type: 'ul',
          items: [
            'Commissariat à la protection de la vie privée du Canada (fédéral) : priv.gc.ca',
            'Commission d’accès à l’information du Québec : cai.gouv.qc.ca',
            'Office of the Information and Privacy Commissioner of Alberta : oipc.ab.ca',
            'Office of the Information and Privacy Commissioner for British Columbia : oipc.bc.ca'],
        }],
    },
    {
      title: '10. Visiteurs internationaux',
      blocks: [
        {
          type: 'p',
          text: 'Notre service est offert depuis le Canada. Si vous accédez à notre site depuis l’étranger, vos renseignements peuvent être transférés et traités au Canada et dans d’autres pays où nos fournisseurs opèrent. En utilisant notre service, vous reconnaissez que les protections peuvent différer de celles de votre pays. Lorsque le RGPD ou le UK GDPR s’applique à vous en plus du droit canadien, nous traitons vos données sur des bases incluant l’exécution contractuelle, les intérêts légitimes, l’obligation légale et le consentement lorsque requis.',
        }],
    },
    {
      title: '11. Mineurs',
      blocks: [
        {
          type: 'p',
          text: 'Notre service s’adresse aux entreprises et professionnels. Nous ne collectons pas sciemment de renseignements personnels auprès de personnes de moins de 18 ans. Si vous croyez que nous avons collecté de tels renseignements, contactez-nous et nous les supprimerons rapidement.',
        }],
    },
    {
      title: '12. Modifications',
      blocks: [
        {
          type: 'p',
          text: 'Nous pouvons mettre à jour la présente politique de confidentialité de temps à autre. La date « Dernière mise à jour » en haut sera modifiée en conséquence. Les changements importants seront communiqués aux clients actifs par e-mail ou par un avis visible sur notre site.',
        }],
    },
    {
      title: '13. Contact',
      blocks: [
        {
          type: 'p',
          segments: [
            { text: 'Questions ou plaintes relatives à la confidentialité : ' },
            { text: v.email, href: `mailto:${v.email}` },
            { text: `. Vous pouvez aussi réserver un appel via notre page de planification : ${v.bookCallUrl}.` }],
        },
        {
          type: 'p',
          className: 'text-muted-2 text-xs mt-4',
          text: 'Cette politique est fournie à titre de transparence et ne constitue pas un avis juridique. Consultez un conseiller qualifié pour des conseils adaptés à votre situation.',
        }],
    }]
}

const PRIVACY_META = {
  en: {
    eyebrow: 'Legal',
    lastUpdatedLabel: 'Last updated:',
    intro: (v) =>
      `${v.entity}'s Privacy Policy (last updated ${v.lastUpdated}) explains how ${v.operator} — operating ${v.entity} from ${v.city}, Quebec, Canada — collects, uses, and protects personal data at ${v.websiteHost} under PIPEDA and Quebec Law 25. Data collected: (1) contact details you submit (name, work email, company name); (2) prospect CSV files you upload — deleted within 90 days of delivery; (3) Cal.com scheduling data (name, email, time slot); (4) basic web analytics (IP address, browser type). ${v.entity} does not sell personal information. Privacy requests: ${v.email}; 30-day response window.`,
    faqEyebrow: 'Privacy FAQ',
    faqTitle: 'Common privacy questions',
  },
  fr: {
    eyebrow: ‘Juridique’,
    lastUpdatedLabel: ‘Dernière mise à jour :’,
    intro: (v) =>
      `La politique de confidentialité de ${v.entity} (dernière mise à jour : ${v.lastUpdated}) explique comment ${v.operator} — exploitant ${v.entity} depuis ${v.city}, Québec, Canada — collecte, utilise et protège les données personnelles sur ${v.websiteHost} en vertu de la LPRPDE et de la Loi 25. Données collectées : (1) coordonnées soumises (nom, e-mail professionnel, entreprise) ; (2) CSV de prospects uploadés — supprimés sous 90 jours après livraison ; (3) données Cal.com (nom, e-mail, créneau) ; (4) analytiques de base (adresse IP, type de navigateur). ${v.entity} ne vend pas de renseignements personnels. Demandes vie privée : ${v.email} ; réponse sous 30 jours.`,
    faqEyebrow: ‘FAQ confidentialité’,
    faqTitle: ‘Questions fréquentes sur la confidentialité’,
  },
}

export function getPrivacyContent(lang, vars) {
  const meta = PRIVACY_META[lang === 'fr' ? 'fr' : 'en']
  const sections = lang === 'fr' ? privacySectionsFr(vars) : privacySectionsEn(vars)
  return { ...meta, sections, intro: meta.intro(vars) }
}
