import {
  LEGAL_EMAIL,
  LEGAL_JURISDICTION,
  LEGAL_OPERATOR,
  LEGAL_PHONE,
  LEGAL_CITY,
  LEGAL_LAST_UPDATED,
} from '../lib/legal'

const FACTS_EN = [
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
    detail: 'Monday to Friday, 9:00 AM to 5:00 PM Eastern Time. Email replies typically within one business day.',
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

const FACTS_FR = [
  {
    term: 'Taux de réponse pilote',
    detail: '3,1 % de taux de réponse moyen en pilote vs ~2,1 % avec des accroches génériques (cohorte 2025).',
  },
  {
    term: 'Pilote gratuit',
    detail: '100 prospects recherchés avec 3 variantes notées QA chacun (échelle 1–5). Sans carte de crédit.',
  },
  {
    term: 'Délai de livraison',
    detail: 'CSV prêt à importer sous 24 à 48 h après réception de la liste (lots pilotes).',
  },
  {
    term: 'Forfaits (USD)',
    detail: 'Starter 499 $/mois (500 prospects), Growth 999 $/mois (2 000 prospects), Agency sur devis.',
  },
  {
    term: 'Processus QA',
    detail: 'Chaque accroche est notée sur la spécificité, l’autonomie, la densité de répétition et la densité factuelle.',
  },
  {
    term: 'Intégrations',
    detail: 'Export CSV pour Smartlead, Instantly, Lemlist, EmailBison, Clay et Apollo.',
  },
  {
    term: 'Localisation',
    detail: `Basé à ${LEGAL_CITY}, Québec, Canada. Livraison à distance en Amérique du Nord, en Europe et pour les équipes B2B mondiales.`,
  },
  {
    term: 'Horaires',
    detail: 'Lundi au vendredi, 9 h à 17 h (heure de l’Est). Réponse email généralement sous un jour ouvré.',
  },
  {
    term: 'Opérateur',
    detail: `${LEGAL_OPERATOR}, ${LEGAL_JURISDICTION}. Politiques mises à jour le ${LEGAL_LAST_UPDATED}.`,
  },
  {
    term: 'Contact',
    detail: LEGAL_PHONE
      ? `Courriel ${LEGAL_EMAIL} ou téléphone ${LEGAL_PHONE}. Page contact : rundossier.co/contact. Réserver un appel : rundossier.co/book-call.`
      : `Courriel ${LEGAL_EMAIL}. Page contact : rundossier.co/contact. Réserver un appel de 30 min : rundossier.co/book-call.`,
  },
]

export function getServiceFacts(lang) {
  return lang === 'fr' ? FACTS_FR : FACTS_EN
}
