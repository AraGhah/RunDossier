import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildHomeJsonLdStack } from './src/lib/static-json-ld.js'
import { buildStaticCrawlMarkup } from './src/lib/static-crawl-content.js'
import { STATIC_LEGAL_PAGES } from './src/lib/static-legal-crawl.js'
import { getSeoForPath } from './src/lib/seo-routes.js'
import { buildJsonLdStack, stackedJsonLdScriptHtml } from './src/lib/seo.js'
import { SITE_URL } from './src/lib/site-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function buildLegalPageHtml(shell, route, buildMarkup) {
  const seo = getSeoForPath(route, 'en')
  const pageUrl = `${SITE_URL}${route}`
  const jsonLdHtml = stackedJsonLdScriptHtml(
    buildJsonLdStack({
      path: route,
      title: seo.title,
      description: seo.description,
      faqs: seo.faqs,
      includeService: seo.includeService,
      includeProduct: seo.includeProduct,
      includeLocalBusiness: true,
      dateModified: seo.dateModified,
      pageType: seo.pageType,
    }),
  )
  const crawl = buildMarkup()

  return shell
    .replace(/<title>.*?<\/title>/, `<title>${escapeAttr(seo.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${escapeAttr(seo.description)}"`,
    )
    .replace(
      /<meta name="robots" content="[^"]*"/,
      `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"`,
    )
    .replace(
      /<meta name="googlebot" content="[^"]*"/,
      `<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1"`,
    )
    // Replace the home canonical with the page-specific one (avoids duplicate canonical bug)
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${pageUrl}" />`,
    )
    // Update OG meta tags to page-specific values
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${escapeAttr(seo.title)}$2`,
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${escapeAttr(seo.description)}$2`,
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      `$1${escapeAttr(pageUrl)}$2`,
    )
    // Update Twitter meta tags to page-specific values
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${escapeAttr(seo.title)}$2`,
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${escapeAttr(seo.description)}$2`,
    )
    .replace(
      /(?:<script id="dossier-jsonld-\d+" type="application\/ld\+json">[\s\S]*?<\/script>\s*)+/,
      `${jsonLdHtml}\n`,
    )
    .replace(
      /<div id="crawl-fallback" class="crawl-fallback">[\s\S]*?<\/div>\s*\n\s*<div id="root"><\/div>/,
      `${crawl.trim()}\n    <div id="root"></div>`,
    )
}

function injectStaticHtml(env) {
  return {
    name: 'inject-static-html',
    transformIndexHtml(html) {
      const phone = (env.VITE_CONTACT_PHONE || '').trim()
      const jsonLdHtml = stackedJsonLdScriptHtml(buildHomeJsonLdStack({ phone }))
      const crawl = buildStaticCrawlMarkup({ phone })

      return html
        .replace(
          /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
          jsonLdHtml,
        )
        .replace(
          /<body>\s*\n\s*<div id="root"><\/div>/,
          `<body>\n${crawl}\n    <div id="root"></div>`,
        )
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      const shell = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')

      for (const { route, buildMarkup } of STATIC_LEGAL_PAGES) {
        const pageHtml = buildLegalPageHtml(shell, route, buildMarkup)
        const dir = path.join(outDir, route.slice(1))
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), pageHtml)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), injectStaticHtml(env)],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-cal': ['@calcom/embed-react'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  }
})
