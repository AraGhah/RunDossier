import { getPageTitle } from './page-headings'
import {
  getHomeFaq,
  getPricingFaq,
  getBookCallFaq,
  getFreeLinesFaq,
  getPrivacyFaq,
  getTermsFaq,
} from './site-data'

const SEO_DESCRIPTIONS = {
  en: {
    '/': 'Dossier researches B2B prospects and writes QA-scored cold email openers. Start with 100 free personalized lines, delivered as a CSV in 24 to 48 hours.',
    '/pricing':
      'Simple pricing for personalized outbound openers. Start with 100 free prospects, then scale with Starter ($499/mo), Growth ($999/mo), or Agency plans.',
    '/about':
      'Dossier helps outbound agencies and B2B founders ship research-backed first lines that sound human, built by operators who care about reply rate.',
    '/free-lines':
      'Claim 100 free personalized openers. Three QA-scored variants per prospect, research signals included, CSV delivered in 24 to 48 hours.',
    '/book-call':
      'Book a 30-minute fit call with Dossier. Review your ICP, see a live opener example, and decide if the free 100-prospect pilot makes sense.',
    '/service':
      'Dossier researches each B2B prospect, writes QA-scored cold email openers, and delivers a CSV for Smartlead, Instantly, Lemlist, and other sequencers.',
    '/contact':
      'Contact Dossier by email, phone, or scheduling link. Pilot requests, pricing questions, and partnership inquiries.',
    '/privacy': 'Privacy Policy for Dossier, how we collect, use, and protect your data.',
    '/terms': 'Terms of Service for Dossier, usage terms for our personalized opener service.',
  },
  fr: {
    '/':
      'Dossier recherche vos prospects B2B et rédige des accroches cold email notées QA. Commencez avec 100 lignes gratuites, livrées en CSV sous 24 à 48 h.',
    '/pricing':
      'Tarifs simples pour des accroches outbound personnalisées. 100 prospects gratuits, puis forfaits Starter (499 $/mois), Growth (999 $/mois) ou Agency.',
    '/about':
      'Dossier aide agences outbound et fondateurs B2B à livrer des premières lignes fondées sur la recherche, par des opérateurs obsédés par le taux de réponse.',
    '/free-lines':
      'Réclamez 100 accroches personnalisées gratuites. Trois variantes notées QA par prospect, signaux de recherche inclus, CSV sous 24 à 48 h.',
    '/book-call':
      'Réservez un appel de 30 minutes avec Dossier. Revoyez votre ICP, voyez un exemple d’accroche en direct et décidez si le pilote gratuit convient.',
    '/service':
      'Dossier recherche chaque prospect B2B, rédige des accroches notées QA et livre un CSV pour Smartlead, Instantly, Lemlist et autres séquenceurs.',
    '/contact':
      'Contactez Dossier par e-mail, téléphone ou lien de planification. Demandes pilote, questions tarifaires et partenariats.',
    '/privacy':
      'Politique de confidentialité de Dossier, comment nous collectons, utilisons et protégeons vos données.',
    '/terms':
      'Conditions d’utilisation de Dossier, termes d’usage de notre service d’accroches personnalisées.',
  },
}

const SEO_ROUTE_FLAGS = {
  '/': { includeService: true, includeProduct: true, faqKey: 'home' },
  '/pricing': { includeService: true, includeProduct: true, faqKey: 'pricing' },
  '/about': { includeProduct: true },
  '/free-lines': { includeService: true, includeProduct: true, faqKey: 'freeLines' },
  '/book-call': { includeService: true, faqKey: 'bookCall' },
  '/service': { includeService: true, includeProduct: true },
  '/contact': { pageType: 'contact' },
  '/privacy': { dateModified: '2026-06-13', faqKey: 'privacy' },
  '/terms': { dateModified: '2026-06-13', faqKey: 'terms' },
}

function getFaqsForKey(key, lang) {
  switch (key) {
    case 'home': return getHomeFaq(lang)
    case 'pricing': return getPricingFaq(lang)
    case 'bookCall': return getBookCallFaq(lang)
    case 'freeLines': return getFreeLinesFaq(lang)
    case 'privacy': return getPrivacyFaq(lang)
    case 'terms': return getTermsFaq(lang)
    default: return undefined
  }
}

export function getSeoForPath(pathname, lang = 'en') {
  const locale = lang === 'fr' ? 'fr' : 'en'
  const flags = SEO_ROUTE_FLAGS[pathname] || SEO_ROUTE_FLAGS['/']
  const descriptions = SEO_DESCRIPTIONS[locale]

  return {
    title: getPageTitle(pathname, locale),
    description: descriptions[pathname] || descriptions['/'],
    faqs: flags.faqKey ? getFaqsForKey(flags.faqKey, locale) : undefined,
    includeService: flags.includeService,
    includeProduct: flags.includeProduct,
    dateModified: flags.dateModified,
    pageType: flags.pageType,
  }
}
