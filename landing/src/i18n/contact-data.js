import { LEGAL_OPERATOR } from '../lib/legal'

const CONTACT_EN = {
  hero: {
    eyebrow: 'Contact',
    intro: (city) =>
      `Reach Dossier in ${city}, Quebec for pilot requests, pricing questions, or partnership inquiries. We respond to email within one business day and offer 30-minute fit calls via Zoom or Microsoft Teams.`,
  },
  cards: {
    email: {
      title: 'Email',
      body: `Write to ${LEGAL_OPERATOR} directly for pilots, deliverables, or billing.`,
      action: null,
    },
    phone: {
      title: 'Phone',
      body: 'Business line for urgent scheduling or account questions.',
      action: null,
    },
    bookCall: {
      title: 'Book a call',
      body: '30-minute fit assessment with a live opener example from your niche.',
      action: 'Open scheduling',
    },
    linkedin: {
      title: 'LinkedIn',
      body: 'Follow Dossier updates and connect with the founder.',
      action: 'View profile',
    },
  },
  business: {
    title: 'Business details',
    operator: (jurisdiction) =>
      `Operator: ${LEGAL_OPERATOR}. Registered business activity in ${jurisdiction}.`,
    privacyPrefix: 'For privacy requests, see our',
    privacyLink: 'Privacy Policy',
  },
  cta1: 'Claim 100 free lines',
  cta2: 'View the service',
}

const CONTACT_FR = {
  hero: {
    eyebrow: 'Contact',
    intro: (city) =>
      `Contactez Dossier à ${city}, Québec pour les demandes de pilote, questions tarifaires ou partenariats. Nous répondons par courriel sous un jour ouvré et proposons des appels de 30 minutes via Zoom ou Microsoft Teams.`,
  },
  cards: {
    email: {
      title: 'Courriel',
      body: `Écrivez directement à ${LEGAL_OPERATOR} pour les pilotes, livrables ou facturation.`,
      action: null,
    },
    phone: {
      title: 'Téléphone',
      body: 'Ligne professionnelle pour planification urgente ou questions de compte.',
      action: null,
    },
    bookCall: {
      title: 'Réserver un appel',
      body: 'Évaluation de 30 minutes avec un exemple d\'accroche live de votre niche.',
      action: 'Ouvrir le calendrier',
    },
    linkedin: {
      title: 'LinkedIn',
      body: 'Suivez les actualités Dossier et connectez-vous avec le fondateur.',
      action: 'Voir le profil',
    },
  },
  business: {
    title: 'Coordonnées',
    operator: (jurisdiction) =>
      `Opérateur : ${LEGAL_OPERATOR}. Activité enregistrée en ${jurisdiction}.`,
    privacyPrefix: 'Pour les demandes de confidentialité, consultez notre',
    privacyLink: 'Politique de confidentialité',
  },
  cta1: '100 lignes gratuites',
  cta2: 'Voir le service',
}

export function getContactContent(lang) {
  return lang === 'fr' ? CONTACT_FR : CONTACT_EN
}
