import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionGlobalConfig } from 'framer-motion'
import { LanguageProvider } from './context/LanguageContext'
import App from './App'
import './index.css'
import { initCloudflareAnalytics } from './lib/cloudflare-analytics.js'

document.documentElement.classList.add('js')
initCloudflareAnalytics()

// Disable all framer-motion animations for users who prefer reduced motion
MotionGlobalConfig.skipAnimations =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
