import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function scrollToHash(hash) {
  const id = hash?.replace('#', '')
  if (!id) return false
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

export default function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    // Hash navigation: smooth scroll to section.
    if (location.hash) {
      // Allow the DOM to paint after route transitions.
      const t = setTimeout(() => {
        if (!scrollToHash(location.hash)) window.scrollTo({ top: 0, left: 0 })
      }, 0)
      return () => clearTimeout(t)
    }

    // Landing page (or any route without hash): always start at top.
    window.scrollTo({ top: 0, left: 0 })
  }, [location.pathname, location.hash])

  return null
}

