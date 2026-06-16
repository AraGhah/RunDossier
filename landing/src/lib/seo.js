import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_TAGLINE,
  SITE_LAST_UPDATED,
  SOCIAL_LINKS,
  CONTACT,
} from './site-data'
import {
  LEGAL_CITY,
  LEGAL_REGION,
  LEGAL_COUNTRY,
  LEGAL_BUSINESS_HOURS,
  LEGAL_EMAIL,
  legalPhoneTel,
} from './legal'

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildOrganizationSchema() {
  const tel = legalPhoneTel()
  const contactPoint = {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: CONTACT.email,
    areaServed: 'Worldwide',
    availableLanguage: ['English', 'French'],
    ...(tel ? { telephone: tel } : {}),
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  }

  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: CONTACT.email,
    ...(tel ? { telephone: tel } : {}),
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: `${SITE_URL}/favicon.svg`,
      contentUrl: `${SITE_URL}/favicon.svg`,
      caption: SITE_NAME,
    },
    contactPoint,
    address: {
      '@type': 'PostalAddress',
      addressLocality: LEGAL_CITY,
      addressRegion: LEGAL_REGION,
      addressCountry: LEGAL_COUNTRY,
    },
    sameAs: SOCIAL_LINKS,
    founder: {
      '@type': 'Person',
      name: CONTACT.founder,
      sameAs: SOCIAL_LINKS[0],
    },
  }
}

export function buildLocalBusinessSchema() {
  const tel = legalPhoneTel()
  return {
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    email: LEGAL_EMAIL,
    ...(tel ? { telephone: tel } : {}),
    image: `${SITE_URL}/favicon.svg`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: LEGAL_CITY,
      addressRegion: LEGAL_REGION,
      addressCountry: LEGAL_COUNTRY,
    },
    areaServed: [
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Place', name: 'Worldwide' },
    ],
    openingHours: LEGAL_BUSINESS_HOURS,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: LEGAL_EMAIL,
      ...(tel ? { telephone: tel } : {}),
      areaServed: 'Worldwide',
    },
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
  }
}

export function buildWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['en', 'fr'],
  }
}

export function buildContactPageSchema({ path, title, description, dateModified }) {
  return {
    '@type': 'ContactPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    mainEntity: { '@id': `${SITE_URL}/#organization` },
    dateModified: dateModified || SITE_LAST_UPDATED,
    inLanguage: 'en',
  }
}

export function buildWebPageSchema({ path, title, description, dateModified }) {
  return {
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    dateModified: dateModified || SITE_LAST_UPDATED,
    inLanguage: 'en',
  }
}

export function buildFaqSchema(faqs, path = '/') {
  if (!faqs?.length) return null
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    url: absoluteUrl(path),
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  }
}

export function buildServiceSchema() {
  return {
    '@type': 'Service',
    '@id': `${SITE_URL}/#service`,
    name: `${SITE_NAME}, Personalized Outbound Openers`,
    description:
      'Done-for-you prospect research and QA-scored personalized first lines for cold email, delivered as a CSV for your sequencer.',
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: 'Worldwide',
    serviceType: 'B2B outbound personalization',
    url: absoluteUrl('/service'),
    offers: [
      {
        '@type': 'Offer',
        name: '100 Free Lines Pilot',
        price: '0',
        priceCurrency: 'USD',
        url: absoluteUrl('/free-lines'),
        description: '100 prospects researched with three QA-scored openers each. No credit card required.',
      },
      {
        '@type': 'Offer',
        name: 'Starter Plan',
        price: '499',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '499',
          priceCurrency: 'USD',
          unitCode: 'MON',
        },
        description: '500 prospects per month with three QA-scored opener variants each, delivered as CSV.',
        url: absoluteUrl('/pricing'),
      },
      {
        '@type': 'Offer',
        name: 'Growth Plan',
        price: '999',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '999',
          priceCurrency: 'USD',
          unitCode: 'MON',
        },
        description: '2,000 prospects per month with priority delivery and dedicated support.',
        url: absoluteUrl('/pricing'),
      },
    ],
  }
}

export function buildProductSchema() {
  return {
    '@type': 'Product',
    '@id': `${SITE_URL}/#product`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    brand: { '@type': 'Brand', name: SITE_NAME },
    url: SITE_URL,
    category: 'B2B Sales Software',
  }
}

export function buildJsonLdGraph({
  path,
  title,
  description,
  faqs,
  includeService,
  includeProduct,
  includeLocalBusiness = true,
  dateModified,
  pageType,
}) {
  const pageSchema =
    pageType === 'contact'
      ? buildContactPageSchema({ path, title, description, dateModified })
      : buildWebPageSchema({ path, title, description, dateModified })

  const graph = [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    ...(includeLocalBusiness ? [buildLocalBusinessSchema()] : []),
    pageSchema,
  ]

  const faqSchema = buildFaqSchema(faqs, path)
  if (faqSchema) graph.push(faqSchema)
  if (includeService) graph.push(buildServiceSchema())
  if (includeProduct) graph.push(buildProductSchema())

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function pageTitle(suffix) {
  if (!suffix) return `${SITE_NAME}, ${SITE_TAGLINE}`
  return `${suffix} | ${SITE_NAME}`
}
