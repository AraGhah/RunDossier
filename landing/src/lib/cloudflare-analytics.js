/**
 * Load Cloudflare Web Analytics from a first-party path so ad blockers
 * do not block static.cloudflareinsights.com. Also strips edge-injected
 * external beacon tags that often fail with "Provisional headers".
 */
export function initCloudflareAnalytics() {
  if (import.meta.env.DEV) return

  const token = import.meta.env.VITE_CF_BEACON_TOKEN?.trim()
  if (!token) return

  if (navigator.doNotTrack === '1') return

  document
    .querySelectorAll('script[src*="cloudflareinsights.com"]')
    .forEach((node) => node.remove())

  if (document.querySelector('script[data-cf-beacon-first-party]')) return

  const script = document.createElement('script')
  script.defer = true
  script.dataset.cfBeaconFirstParty = 'true'
  script.src = `/cloudflare-beacon/beacon.min.js/${token}`
  document.head.appendChild(script)
}
