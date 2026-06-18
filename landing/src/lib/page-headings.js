import { pageTitle } from './seo'
import { translations } from '../i18n/translations'

/** Visible H1 must match document title token-for-token for SEO audits. */
export const PAGE_TITLES = {
  '/': pageTitle(),
  '/pricing': pageTitle('Pricing'),
  '/about': pageTitle('About'),
  '/free-lines': pageTitle('100 Free Lines'),
  '/book-call': pageTitle('Book a Call'),
  '/service': pageTitle('Service'),
  '/contact': pageTitle('Contact'),
  '/privacy': pageTitle('Privacy Policy'),
  '/terms': pageTitle('Terms of Service'),
}

const PAGE_TITLE_KEYS = {
  '/': 'page.home.h1',
  '/pricing': 'page.pricing.h1',
  '/about': 'page.about.h1',
  '/free-lines': 'page.freeLines.h1',
  '/book-call': 'page.bookCall.h1',
  '/service': 'page.service.h1',
  '/contact': 'page.contact.h1',
  '/privacy': 'page.privacy.h1',
  '/terms': 'page.terms.h1',
}

export function getPageTitle(pathname, lang = 'en') {
  const key = PAGE_TITLE_KEYS[pathname]
  if (key && translations[lang]?.[key]) return translations[lang][key]
  return PAGE_TITLES[pathname] || PAGE_TITLES['/']
}

export function getPageH1(pathname, lang = 'en') {
  return getPageTitle(pathname, lang)
}
