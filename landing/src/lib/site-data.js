import {
  LEGAL_EMAIL,
  LEGAL_JURISDICTION,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_PHONE,
  LEGAL_CITY,
  LEGAL_BUSINESS_HOURS,
} from './legal'

export const SITE_URL = 'https://rundossier.co'
export const SITE_NAME = 'Dossier'
export const SITE_TAGLINE = 'Personalized outbound openers that get replies'
export const SITE_DESCRIPTION =
  'Research-backed first lines for outbound agencies and B2B founders. Structured prospect research, QA-scored openers, CSV delivery in 24–48 hours.'
export const SITE_LAST_UPDATED = '2026-06-16'

export const SOCIAL_LINKS = [
  'https://www.linkedin.com/in/ara-ghahramanyan-086261405/',
  'https://rundossier.co',
]

export const HOME_FAQ = [
  {
    q: 'Is this just ChatGPT with a LinkedIn scrape?',
    a: 'No. Bulk AI generation produces detectable slop. The value is structured lead research, signal selection, multi-variant generation, and a separate QA scoring pass. Openers that fail QA get rejected or retried before you see them.',
  },
  {
    q: 'Do you send the emails for us?',
    a: 'No. We only deliver personalized first lines in a ready-to-import CSV. You keep full control of your inboxes, sending sequencer, offer, and volume. No campaign access requested or required.',
  },
  {
    q: 'What if a prospect does not have much online presence?',
    a: 'Low-confidence prospects are flagged in the deliverable. You see which leads have thin signal and decide whether to pull them, use the lower-confidence opener, or re-queue them.',
  },
  {
    q: 'How fast do we get the first 100 openers?',
    a: 'Pilot batch: typically 24 to 48 hours for 100 prospects. Ongoing runs for larger batches can be scheduled at regular intervals.',
  },
  {
    q: 'What happens after the free pilot?',
    a: 'We review results together. If the openers beat your baseline, we discuss a rollout plan covering pricing, volume, and cadence. No automatic billing or commitment from the pilot.',
  },
  {
    q: 'Who gets the best results from Dossier?',
    a: 'Outbound agencies, B2B founders doing cold email, and SDR teams with large prospect lists where reply rate is the primary KPI. Best for companies targeting decision-makers at 10 to 200 person companies.',
  },
]

export const PRICING_FAQ = [
  {
    q: 'Is the 100 free lines pilot really free?',
    a: 'Yes. 100 prospects, no credit card, no commitment. We research and write three QA-scored openers per lead and deliver within 48 hours. If the openers beat your baseline, we talk about a paid plan.',
  },
  {
    q: 'What counts as a prospect toward my monthly limit?',
    a: 'Each row in your CSV counts as one prospect. We research each one and write three opener variants. Prospects flagged as low-confidence do not count toward your monthly limit.',
  },
  {
    q: 'Can I pause or cancel anytime?',
    a: 'Yes. Monthly plans can be paused or cancelled at any time. There are no annual contracts on Starter or Growth unless you request one for a discount.',
  },
  {
    q: 'How does billing work for the Agency plan?',
    a: 'Agency pricing is based on volume, delivery speed, and integration requirements. Book a 30 minute call and we will put together a custom proposal within 24 hours.',
  },
  {
    q: 'What happens to prospects flagged as low-confidence?',
    a: 'They appear in your deliverable with a flag and a note explaining what signal was missing. You decide whether to pull them from the campaign, use the lower-confidence opener, or re-queue them.',
  },
]

export const BOOK_CALL_FAQ = [
  {
    q: 'Is this a sales call?',
    a: 'It is a fit assessment. We ask about your current results and your ICP, show you a live example from your niche, and confirm whether the pilot makes sense for you. If Dossier is not a fit, we say so directly.',
  },
  {
    q: 'What do I need to prepare?',
    a: 'Nothing formal. It helps to have a rough idea of your current reply rate and a sense of who you are targeting. We will do the rest on the call.',
  },
  {
    q: 'What happens after the call?',
    a: 'If we agree the pilot makes sense, you send us your prospect list within 24 hours and we deliver the first 100 openers within 48 hours of receiving it.',
  },
  {
    q: 'What if I cannot attend the scheduled time?',
    a: 'You can reschedule anytime through the Cal.com booking calendar. There is no penalty for rescheduling.',
  },
  {
    q: 'Is the 100 free lines offer still available after the call?',
    a: 'Yes. The pilot offer is available whether or not you book a call first. The call helps us understand your ICP so the pilot batch is better calibrated.',
  },
]

export const FREE_LINES_FAQ = [
  {
    q: 'What is included in the 100 free lines pilot?',
    a: 'Three QA-scored opener variants per prospect, the research signal used, confidence scoring, and a ready-to-import CSV delivered in 24 to 48 hours.',
  },
  {
    q: 'Do you need access to my email sequencer?',
    a: 'No. We never ask for inboxes, sequencer logins, or campaign settings. You import the CSV yourself.',
  },
  {
    q: 'Which sequencers work with the CSV?',
    a: 'Smartlead, Instantly, Lemlist, EmailBison, and any tool that accepts CSV imports for personalized first lines.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most 100-prospect pilots are delivered within 24 to 48 hours after we receive your list. Complex ICPs may take the full 48 hours.',
  },
  {
    q: 'What counts as one prospect?',
    a: 'Each row in your CSV counts as one prospect. We research that lead and write three opener variants. Thin-profile leads are flagged, not hidden.',
  },
]

export const PRIVACY_FAQ = [
  {
    q: 'Who operates Dossier and where is the business based?',
    a: 'Dossier is operated by Ara Ghahramanyan from Montreal, Quebec, Canada. We serve B2B outbound teams worldwide.',
  },
  {
    q: 'What personal data does Dossier collect?',
    a: 'We collect business contact details you submit (name, email, company), prospect lists you upload for research, and standard website analytics. We do not sell personal data.',
  },
  {
    q: 'How can I request access or deletion of my data?',
    a: `Email ${LEGAL_EMAIL} with your request. We respond within 30 days for access, correction, or deletion under applicable Canadian privacy law.`,
  },
]

export const TERMS_FAQ = [
  {
    q: 'What service does Dossier provide?',
    a: 'Dossier researches B2B prospects and delivers QA-scored personalized cold email openers as a CSV. We do not send emails or access your sequencer unless explicitly agreed in writing.',
  },
  {
    q: 'Who owns the openers and research output?',
    a: 'You receive a license to use the delivered openers in your campaigns. Dossier retains the right to use anonymized workflow learnings to improve quality.',
  },
  {
    q: 'Can I cancel a paid plan?',
    a: 'Yes. Monthly Starter and Growth plans can be paused or cancelled at any time. Agency contracts follow the terms in your signed agreement.',
  },
  {
    q: 'What law governs these Terms?',
    a: `These Terms are governed by the laws of ${LEGAL_JURISDICTION}, without regard to conflict-of-law rules.`,
  },
]

const PRIVACY_FAQ_FR = [
  {
    q: 'Qui exploite Dossier et où est basée l’entreprise ?',
    a: 'Dossier est exploité par Ara Ghahramanyan depuis Montréal, Québec, Canada. Nous servons des équipes outbound B2B dans le monde entier.',
  },
  {
    q: 'Quelles données personnelles Dossier collecte-t-il ?',
    a: 'Nous collectons les coordonnées professionnelles que vous soumettez (nom, e-mail, entreprise), les listes de prospects que vous téléversez pour la recherche, et les analyses web standard. Nous ne vendons pas de données personnelles.',
  },
  {
    q: 'Comment demander l’accès ou la suppression de mes données ?',
    a: `Écrivez à ${LEGAL_EMAIL} avec votre demande. Nous répondons sous 30 jours pour l’accès, la correction ou la suppression conformément à la loi canadienne applicable.`,
  },
]

const TERMS_FAQ_FR = [
  {
    q: 'Quel service Dossier fournit-il ?',
    a: 'Dossier recherche des prospects B2B et livre des accroches cold email personnalisées et notées QA en CSV. Nous n’envoyons pas d’e-mails ni n’accédons à votre séquenceur sauf accord écrit explicite.',
  },
  {
    q: 'Qui possède les accroches et les livrables de recherche ?',
    a: 'Vous recevez une licence pour utiliser les accroches livrées dans vos campagnes. Dossier conserve le droit d’utiliser des apprentissages de flux anonymisés pour améliorer la qualité.',
  },
  {
    q: 'Puis-je annuler un forfait payant ?',
    a: 'Oui. Les forfaits mensuels Starter et Growth peuvent être suspendus ou annulés à tout moment. Les contrats Agency suivent les conditions de votre accord signé.',
  },
  {
    q: 'Quel droit régit ces conditions ?',
    a: `Ces conditions sont régies par les lois de ${LEGAL_JURISDICTION}, sans égard aux règles de conflit de lois.`,
  },
]

const HOME_FAQ_FR = [
  {
    q: 'Est-ce juste ChatGPT avec un scrape LinkedIn ?',
    a: 'Non. La génération IA en masse produit du contenu détectable. La valeur est dans la recherche structurée, la sélection de signaux, la génération multi-variantes et une passe QA séparée. Les accroches qui échouent sont rejetées ou relancées avant livraison.',
  },
  {
    q: 'Envoyez-vous les e-mails pour nous ?',
    a: 'Non. Nous livrons uniquement des premières lignes personnalisées en CSV prêt à importer. Vous gardez le contrôle de vos boîtes, séquenceur, offre et volume. Aucun accès campagne requis.',
  },
  {
    q: 'Et si un prospect a peu de présence en ligne ?',
    a: 'Les prospects à faible confiance sont signalés dans le livrable. Vous voyez quels leads manquent de signaux et décidez de les retirer, utiliser l’accroche basse confiance ou les remettre en file.',
  },
  {
    q: 'En combien de temps reçoit-on les 100 premières accroches ?',
    a: 'Lot pilote : typiquement 24 à 48 h pour 100 prospects. Les runs récurrents sur de plus gros volumes peuvent être planifiés à intervalle régulier.',
  },
  {
    q: 'Que se passe-t-il après le pilote gratuit ?',
    a: 'Nous revoyons les résultats ensemble. Si les accroches battent votre baseline, nous discutons d’un déploiement (tarifs, volume, cadence). Aucune facturation automatique ni engagement lié au pilote.',
  },
  {
    q: 'Qui obtient les meilleurs résultats avec Dossier ?',
    a: 'Agences outbound, fondateurs B2B en cold email et équipes SDR avec de grandes listes où le taux de réponse est le KPI principal. Idéal pour cibler des décideurs dans des entreprises de 10 à 200 personnes.',
  },
]

const PRICING_FAQ_FR = [
  {
    q: 'Les 100 lignes gratuites sont-elles vraiment gratuites ?',
    a: 'Oui. 100 prospects, sans carte bancaire ni engagement. Nous recherchons et rédigeons trois accroches notées QA par lead, livrées sous 48 h. Si elles battent votre baseline, nous parlons d’un forfait payant.',
  },
  {
    q: 'Qu’est-ce qui compte comme un prospect dans la limite mensuelle ?',
    a: 'Chaque ligne de votre CSV compte pour un prospect. Nous le recherchons et rédigeons trois variantes. Les prospects signalés faible confiance ne comptent pas dans la limite mensuelle.',
  },
  {
    q: 'Puis-je mettre en pause ou annuler à tout moment ?',
    a: 'Oui. Les forfaits mensuels peuvent être suspendus ou annulés à tout moment. Pas de contrat annuel sur Starter ou Growth sauf demande pour une remise.',
  },
  {
    q: 'Comment fonctionne la facturation Agency ?',
    a: 'Le tarif Agency dépend du volume, de la vitesse de livraison et des intégrations. Réservez un appel de 30 minutes et nous envoyons une proposition sous 24 h.',
  },
  {
    q: 'Que deviennent les prospects à faible confiance ?',
    a: 'Ils apparaissent dans le livrable avec un drapeau et une note sur le signal manquant. Vous décidez de les retirer, utiliser l’accroche ou les remettre en file.',
  },
]

const BOOK_CALL_FAQ_FR = [
  {
    q: 'Est-ce un appel commercial ?',
    a: 'C’est une évaluation d’adéquation. Nous parlons de vos résultats et de votre ICP, montrons un exemple live dans votre niche et confirmons si le pilote a du sens. Si Dossier ne convient pas, nous le disons clairement.',
  },
  {
    q: 'Que dois-je préparer ?',
    a: 'Rien de formel. Une idée de votre taux de réponse actuel et de votre cible aide. Nous faisons le reste pendant l’appel.',
  },
  {
    q: 'Que se passe-t-il après l’appel ?',
    a: 'Si le pilote convient, vous nous envoyez votre liste sous 24 h et nous livrons les 100 premières accroches sous 48 h après réception.',
  },
  {
    q: 'Et si je ne peux pas être là à l’heure prévue ?',
    a: 'Vous pouvez reprogrammer à tout moment via le calendrier Cal.com. Aucune pénalité pour un report.',
  },
  {
    q: 'L’offre 100 lignes gratuites reste-t-elle disponible après l’appel ?',
    a: 'Oui. Le pilote est disponible avec ou sans appel préalable. L’appel nous aide à calibrer le lot pilote sur votre ICP.',
  },
]

const FREE_LINES_FAQ_FR = [
  {
    q: 'Qu’est-ce qui est inclus dans le pilote 100 lignes gratuites ?',
    a: 'Trois variantes notées QA par prospect, le signal de recherche utilisé, un score de confiance et un CSV prêt à importer sous 24 à 48 h.',
  },
  {
    q: 'Avez-vous besoin d’accéder à mon séquenceur ?',
    a: 'Non. Nous ne demandons jamais de boîtes mail, identifiants séquenceur ni paramètres de campagne. Vous importez le CSV vous-même.',
  },
  {
    q: 'Quels séquenceurs acceptent le CSV ?',
    a: 'Smartlead, Instantly, Lemlist, EmailBison et tout outil acceptant un CSV pour des premières lignes personnalisées.',
  },
  {
    q: 'Combien de temps prend la livraison ?',
    a: 'La plupart des pilotes 100 prospects sont livrés sous 24 à 48 h après réception de la liste. Les ICP complexes peuvent prendre 48 h.',
  },
  {
    q: 'Qu’est-ce qui compte comme un prospect ?',
    a: 'Chaque ligne de votre CSV compte pour un prospect. Nous le recherchons et rédigeons trois variantes. Les profils fins sont signalés, pas masqués.',
  },
]

export function getHomeFaq(lang) {
  return lang === 'fr' ? HOME_FAQ_FR : HOME_FAQ
}

export function getPricingFaq(lang) {
  return lang === 'fr' ? PRICING_FAQ_FR : PRICING_FAQ
}

export function getBookCallFaq(lang) {
  return lang === 'fr' ? BOOK_CALL_FAQ_FR : BOOK_CALL_FAQ
}

export function getFreeLinesFaq(lang) {
  return lang === 'fr' ? FREE_LINES_FAQ_FR : FREE_LINES_FAQ
}

export function getPrivacyFaq(lang) {
  return lang === 'fr' ? PRIVACY_FAQ_FR : PRIVACY_FAQ
}

export function getTermsFaq(lang) {
  return lang === 'fr' ? TERMS_FAQ_FR : TERMS_FAQ
}

export const SITE_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/service', label: 'Service' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/about', label: 'About' },
  { path: '/free-lines', label: '100 Free Lines' },
  { path: '/book-call', label: 'Book a Call' },
  { path: '/contact', label: 'Contact' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms of Service' },
]

export const CONTACT = {
  email: LEGAL_EMAIL,
  phone: LEGAL_PHONE,
  founder: LEGAL_OPERATOR,
  legalLastUpdated: LEGAL_LAST_UPDATED,
  jurisdiction: LEGAL_JURISDICTION,
}

/** Verifiable service facts surfaced on key pages (factual density + service signals). */
export const SERVICE_FACTS = [
  {
    term: 'Pilot reply rate',
    detail: '3.1% average reply rate in pilot campaigns vs. ~2.1% generic cold email baseline (2025 cohort).',
  },
  {
    term: 'Free pilot',
    detail: '100 prospects researched with 3 QA-scored opener variants each (1–5 scale). No credit card.',
  },
  {
    term: 'Delivery SLA',
    detail: 'Ready-to-import CSV in 24–48 hours after prospect list intake (pilot batches).',
  },
  {
    term: 'Plans (USD)',
    detail: 'Starter $499/mo (500 prospects), Growth $999/mo (2,000 prospects), Agency pricing on request.',
  },
  {
    term: 'QA process',
    detail: 'Each opener is scored for specificity, autonomy, repetition density, and factual density before delivery.',
  },
  {
    term: 'Integrations',
    detail: 'CSV export for Smartlead, Instantly, Lemlist, EmailBison, Clay, and Apollo workflows.',
  },
  {
    term: 'Location',
    detail: `Based in ${LEGAL_CITY}, Quebec, Canada. Remote delivery to North America, Europe, and worldwide B2B teams.`,
  },
  {
    term: 'Business hours',
    detail: `${LEGAL_BUSINESS_HOURS}. Email replies typically within one business day.`,
  },
  {
    term: 'Operator',
    detail: `${LEGAL_OPERATOR}, ${LEGAL_JURISDICTION}. Policies last updated ${LEGAL_LAST_UPDATED}.`,
  },
  {
    term: 'Contact',
    detail: LEGAL_PHONE
      ? `Email ${LEGAL_EMAIL} or phone ${LEGAL_PHONE}. Contact page: rundossier.co/contact. Book a fit call at rundossier.co/book-call.`
      : `Email ${LEGAL_EMAIL}. Contact page: rundossier.co/contact. Book a 30-minute fit call at rundossier.co/book-call.`,
  },
]
