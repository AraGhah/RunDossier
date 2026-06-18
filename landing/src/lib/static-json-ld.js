/**
 * Global JSON-LD injected into index.html at build time (visible without JavaScript).
 * Keep in sync with seo.js builders.
 */
import { HOME_FAQ } from './site-data'
import { buildJsonLdStack, pageTitle } from './seo'

export function buildHomeJsonLdOptions({ phone = '' } = {}) {
  return {
    path: '/',
    title: pageTitle(),
    description:
      'Dossier researches B2B prospects and writes QA-scored cold email openers. Start with 100 free personalized lines, delivered as a CSV in 24 to 48 hours.',
    faqs: HOME_FAQ,
    includeService: true,
    includeProduct: true,
    includeLocalBusiness: true,
    phone,
  }
}

/** @deprecated Use buildHomeJsonLdStack + stackedJsonLdScriptHtml for static HTML injection. */
export function buildGlobalStaticGraph(options = {}) {
  const { phone = '', ...rest } = options
  const stack = buildJsonLdStack(buildHomeJsonLdOptions({ phone, ...rest }))
  return {
    '@context': 'https://schema.org',
    '@graph': stack,
  }
}

export function buildHomeJsonLdStack({ phone = '' } = {}) {
  return buildJsonLdStack(buildHomeJsonLdOptions({ phone }))
}
