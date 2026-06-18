import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { absoluteUrl, buildJsonLdStack, stackedJsonLdScriptHtml } from '../lib/seo'
import { getSeoForPath } from '../lib/seo-routes'
import { SITE_NAME, LINKEDIN_URL } from '../lib/site-data'
import { useTranslation } from '../context/LanguageContext'

const JSON_LD_PREFIX = 'dossier-jsonld-'

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

function upsertJsonLdStack(stack) {
  // Collect old nodes by reference BEFORE adding new ones so clearJsonLdScripts
  // doesn't accidentally remove scripts we just appended.
  const oldNodes = [
    ...document.querySelectorAll(`script[id^="${JSON_LD_PREFIX}"]`),
    ...(document.getElementById('dossier-json-ld') ? [document.getElementById('dossier-json-ld')] : []),
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ]
  const markup = stackedJsonLdScriptHtml(stack, { indent: '' })
  const tpl = document.createElement('template')
  tpl.innerHTML = markup.trim()
  tpl.content.querySelectorAll('script').forEach((node) => {
    document.head.appendChild(node)
  })
  // Remove old nodes AFTER new ones are in DOM — zero gap for crawlers.
  oldNodes.forEach((node) => node.remove())
}

export default function SeoHead() {
  const { pathname } = useLocation()
  const { lang } = useTranslation()
  const seo = getSeoForPath(pathname, lang)
  const canonical = absoluteUrl(pathname)

  useEffect(() => {
    document.title = seo.title
    upsertMeta('description', seo.description)
    upsertMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1')
    upsertMeta('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1')
    upsertLink('canonical', canonical)
    upsertLink('me', LINKEDIN_URL)

    upsertOgMeta('og:title', seo.title)
    upsertOgMeta('og:description', seo.description)
    upsertOgMeta('og:url', canonical)
    upsertOgMeta('og:type', 'website')
    upsertOgMeta('og:site_name', SITE_NAME)

    upsertMeta('twitter:card', 'summary')
    upsertMeta('twitter:title', seo.title)
    upsertMeta('twitter:description', seo.description)

    upsertJsonLdStack(
      buildJsonLdStack({
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
