/**
 * Cloudflare Web Analytics — first-party proxy to avoid ad-blocker domain blocks.
 * Requires /cloudflare-beacon/* → static.cloudflareinsights.com in public/_redirects.
 * In Cloudflare dashboard, disable automatic Web Analytics injection to avoid duplicate beacons.
 */
export function initCloudflareAnalytics() {
  if (import.meta.env.DEV) return

  const token = import.meta.env.VITE_CF_BEACON_TOKEN?.trim()
  if (!token) return

  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return

  if (document.querySelector('script[data-cf-beacon]')) return

  const script = document.createElement('script')
  script.src = '/cloudflare-beacon/beacon.min.js'
  script.defer = true
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }))
  script.onerror = () => {}
  document.head.appendChild(script)
}
