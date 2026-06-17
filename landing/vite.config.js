import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildGlobalStaticGraph } from './src/lib/static-json-ld.js'
import { buildStaticCrawlMarkup } from './src/lib/static-crawl-content.js'
import { STATIC_LEGAL_PAGES } from './src/lib/static-legal-crawl.js'
import { getSeoForPath } from './src/lib/seo-routes.js'
import { buildJsonLdGraph } from './src/lib/seo.js'
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
  const jsonLd = JSON.stringify(
    buildJsonLdGraph({
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
    null,
    2,
  )
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
  const crawl = buildMarkup()

  return shell
    .replace(/<title>.*?<\/title>/, `<title>${escapeAttr(seo.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${escapeAttr(seo.description)}"`,
    )
    .replace(
      /<head>/,
      `<head>\n    <link rel="canonical" href="${SITE_URL}${route}" />`,
    )
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${jsonLd}\n    </script>`,
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
      const json = JSON.stringify(buildGlobalStaticGraph({ phone }), null, 2)
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')
      const crawl = buildStaticCrawlMarkup({ phone })

      return html
        .replace(
          /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
          `<script type="application/ld+json">\n${json}\n    </script>`,
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
