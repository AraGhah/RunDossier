import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import About from './pages/About'
import FreeLines from './pages/FreeLines'
import BookCall from './pages/BookCall'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

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

export default function App() {
  const location = useLocation()
  return (
    <div className="font-sans bg-cream text-ink-2 antialiased">
      <Nav />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"           element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/pricing"    element={<PageWrapper><Pricing /></PageWrapper>} />
          <Route path="/about"      element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/free-lines" element={<PageWrapper><FreeLines /></PageWrapper>} />
          <Route path="/book-call"  element={<PageWrapper><BookCall /></PageWrapper>} />
          <Route path="/privacy"    element={<PageWrapper><Privacy /></PageWrapper>} />
          <Route path="/terms"      element={<PageWrapper><Terms /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  )
}
