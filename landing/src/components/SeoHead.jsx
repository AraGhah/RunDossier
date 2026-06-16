import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { absoluteUrl, buildJsonLdGraph } from '../lib/seo'
import { getSeoForPath } from '../lib/seo-routes'
import { SITE_NAME } from '../lib/site-data'
import { useTranslation } from '../context/LanguageContext'

const JSON_LD_ID = 'dossier-json-ld'

function upsertMeta(name, content) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertOgMeta(property, content) {
  if (!content) return
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(data) {
  let el = document.getElementById(JSON_LD_ID)
  if (!el) {
    el = document.createElement('script')
    el.id = JSON_LD_ID
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export default function SeoHead() {
  const { pathname } = useLocation()
  const { lang } = useTranslation()
  const seo = getSeoForPath(pathname, lang)
  const canonical = absoluteUrl(pathname)

  useEffect(() => {
    document.title = seo.title
    upsertMeta('description', seo.description)
    upsertLink('canonical', canonical)

    upsertOgMeta('og:title', seo.title)
    upsertOgMeta('og:description', seo.description)
    upsertOgMeta('og:url', canonical)
    upsertOgMeta('og:type', 'website')
    upsertOgMeta('og:site_name', SITE_NAME)

    upsertMeta('twitter:card', 'summary')
    upsertMeta('twitter:title', seo.title)
    upsertMeta('twitter:description', seo.description)

    upsertJsonLd(
      buildJsonLdGraph({
        path: pathname,
        title: seo.title,
        description: seo.description,
        faqs: seo.faqs,
        includeService: seo.includeService,
        includeProduct: seo.includeProduct,
        dateModified: seo.dateModified,
        pageType: seo.pageType,
      }),
    )
  }, [pathname, lang, seo, canonical])

  return null
}
