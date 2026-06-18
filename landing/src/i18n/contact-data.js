import {
  LEGAL_OPERATOR,
  LEGAL_ENTITY,
  LEGAL_EMAIL,
  LEGAL_WEBSITE,
  LEGAL_BUSINESS_HOURS,
  LEGAL_LAST_UPDATED,
  LEGAL_CITY,
} from '../lib/legal'
import { CAL_MEETING_DURATION_LABEL, CAL_HOST_NAME, calBookingUrl } from '../lib/cal'

const CAL_BOOK_URL = calBookingUrl('zoom')

const CONTACT_EN = {
  hero: {
    eyebrow: 'Contact',
    intro: (city) =>
      `Contact ${LEGAL_ENTITY} at ${LEGAL_EMAIL} for pilot requests (100 free prospects, CSV in 24–48 hours), Starter ($499/mo) or Growth ($999/mo) pricing, or partnerships. We are based in ${city}, Quebec, Canada; email replies within one business day (${LEGAL_BUSINESS_HOURS}). Book a ${CAL_MEETING_DURATION_LABEL} fit call via cal.com/preframe on Zoom or Microsoft Teams.`,
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
      body: `${CAL_MEETING_DURATION_LABEL} fit call with ${CAL_HOST_NAME} (founder, ${LEGAL_CITY}, Quebec, Canada) on Zoom or Microsoft Teams. Pick a slot at ${CAL_BOOK_URL} or ${LEGAL_WEBSITE}/book-call. Agenda: your ICP, one live QA-scored opener from your niche, and whether the 100-prospect free pilot (CSV in 24–48 hours) fits. Scheduling windows: ${LEGAL_BUSINESS_HOURS}.`,
      action: 'Open scheduling',
    },
    linkedin: {
      title: 'LinkedIn',
      body: 'Follow Dossier updates and connect with the founder on LinkedIn or book via Cal.com/preframe.',
      action: 'View profile',
    },
  },
  business: {
    title: 'Business details',
    operator: (jurisdiction) =>
      `${LEGAL_ENTITY} is a B2B prospect-research and personalized cold-email opener service operated by ${LEGAL_OPERATOR} from Montreal, Quebec, Canada. Website: ${LEGAL_WEBSITE}. Registered business activity in ${jurisdiction}. Service: up to 100 free pilot prospects (three QA-scored openers each, 24–48 h delivery), then paid monthly plans. Privacy policy last updated ${LEGAL_LAST_UPDATED}.`,
    privacyPrefix: 'For access, correction, or deletion requests under PIPEDA or Quebec Law 25, see our',
    privacyLink: 'Privacy Policy',
  },
  cta1: 'Claim 100 free lines',
  cta2: 'View the service',
  publicProfilesTitle: 'Public profiles',
}

const CONTACT_FR = {
  hero: {
    eyebrow: 'Contact',
    intro: (city) =>
      `Contactez ${LEGAL_ENTITY} à ${LEGAL_EMAIL} pour un pilote (100 prospects gratuits, CSV sous 24–48 h), les tarifs Starter (499 $/mois) ou Growth (999 $/mois), ou un partenariat. Basés à ${city}, Québec, Canada ; réponse courriel sous un jour ouvré (${LEGAL_BUSINESS_HOURS}). Réservez un appel de ${CAL_MEETING_DURATION_LABEL} sur cal.com/preframe via Zoom ou Microsoft Teams.`,
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
      body: `Appel de ${CAL_MEETING_DURATION_LABEL} avec ${CAL_HOST_NAME} (fondateur, ${LEGAL_CITY}, Québec, Canada) sur Zoom ou Microsoft Teams. Choisissez un créneau sur ${CAL_BOOK_URL} ou ${LEGAL_WEBSITE}/book-call. Ordre du jour : votre ICP, une accroche live notée QA de votre niche, et l’adéquation du pilote gratuit 100 prospects (CSV sous 24–48 h). Créneaux : ${LEGAL_BUSINESS_HOURS}.`,
      action: 'Ouvrir le calendrier',
    },
    linkedin: {
      title: 'LinkedIn',
      body: 'Suivez les actualités Dossier et connectez-vous avec le fondateur sur LinkedIn ou réservez via Cal.com/preframe.',
      action: 'Voir le profil',
    },
  },
  business: {
    title: 'Coordonnées',
    operator: (jurisdiction) =>
      `${LEGAL_ENTITY} est un service de recherche de prospects B2B et d’accroches cold email personnalisées exploité par ${LEGAL_OPERATOR} depuis Montréal, Québec, Canada. Site : ${LEGAL_WEBSITE}. Activité enregistrée en ${jurisdiction}. Offre : jusqu’à 100 prospects pilote gratuits (trois accroches notées QA chacun, livraison 24–48 h), puis forfaits mensuels payants. Politique de confidentialité mise à jour le ${LEGAL_LAST_UPDATED}.`,
    privacyPrefix: 'Pour l’accès, la correction ou la suppression en vertu de la LPRPDE ou de la Loi 25, consultez notre',
    privacyLink: 'Politique de confidentialité',
  },
  cta1: '100 lignes gratuites',
  cta2: 'Voir le service',
  publicProfilesTitle: 'Profils publics',
}

export function getContactContent(lang) {
  return lang === 'fr' ? CONTACT_FR : CONTACT_EN
}
