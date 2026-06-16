import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Nav from './components/Nav'
import Footer from './components/Footer'
import SeoHead from './components/SeoHead'
import ScrollManager from './components/ScrollManager'

const Home      = lazy(() => import('./pages/Home'))
const Pricing   = lazy(() => import('./pages/Pricing'))
const About     = lazy(() => import('./pages/About'))
const FreeLines = lazy(() => import('./pages/FreeLines'))
const BookCall  = lazy(() => import('./pages/BookCall'))
const Contact   = lazy(() => import('./pages/Contact'))
const Service   = lazy(() => import('./pages/Service'))
const Privacy   = lazy(() => import('./pages/Privacy'))
const Terms     = lazy(() => import('./pages/Terms'))

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.32,0.72,0,1] } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.25, ease: [0.32,0.72,0,1] } },
}

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit">
      {children}
    </motion.div>
  )
}

function PageFallback() {
  return <div className="min-h-screen bg-cream" aria-hidden="true" />
}

export default function App() {
  const location = useLocation()
  return (
    <div className="font-sans bg-cream text-ink-2 antialiased">
      <ScrollManager />
      <SeoHead />
      <Nav />
      <main id="main-content" tabIndex="-1" className="outline-none">
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"           element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/pricing"    element={<PageWrapper><Pricing /></PageWrapper>} />
              <Route path="/about"      element={<PageWrapper><About /></PageWrapper>} />
              <Route path="/free-lines" element={<PageWrapper><FreeLines /></PageWrapper>} />
              <Route path="/book-call"  element={<PageWrapper><BookCall /></PageWrapper>} />
              <Route path="/contact"    element={<PageWrapper><Contact /></PageWrapper>} />
              <Route path="/service"    element={<PageWrapper><Service /></PageWrapper>} />
              <Route path="/privacy"    element={<PageWrapper><Privacy /></PageWrapper>} />
              <Route path="/terms"      element={<PageWrapper><Terms /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
