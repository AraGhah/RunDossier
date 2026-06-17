/**
 * Global JSON-LD injected into index.html at build time (visible without JavaScript).
 * Keep in sync with seo.js builders.
 */
import { HOME_FAQ } from './site-data'
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildServiceSchema,
  buildLocalBusinessSchema,
  buildFaqSchema,
  buildWebPageSchema,
} from './seo'

export function buildGlobalStaticGraph({ phone = '' } = {}) {
  const graph = [
    buildOrganizationSchema({ phone }),
    buildWebSiteSchema(),
    buildLocalBusinessSchema({ phone }),
    buildServiceSchema(),
    buildWebPageSchema({
      path: '/',
      title: 'Dossier, Personalized outbound openers that get replies',
      description:
        'Research-backed first lines for outbound agencies and B2B founders. Structured prospect research, QA-scored openers, CSV delivery in 24 to 48 hours.',
    }),
    buildFaqSchema(HOME_FAQ, '/'),
  ].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
