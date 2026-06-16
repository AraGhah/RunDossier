import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildGlobalStaticGraph } from './src/lib/static-json-ld.js'

function injectStaticJsonLd() {
  return {
    name: 'inject-static-jsonld',
    transformIndexHtml(html) {
      const json = JSON.stringify(buildGlobalStaticGraph(), null, 2)
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')
      return html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">\n${json}\n    </script>`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), injectStaticJsonLd()],
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
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-cal':    ['@calcom/embed-react'],
          'vendor-icons':  ['lucide-react'],
        },
      },
    },
  },
})
