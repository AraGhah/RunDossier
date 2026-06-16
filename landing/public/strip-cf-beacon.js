(function () {
  function stripExternalBeacon() {
    document
      .querySelectorAll('script[src*="cloudflareinsights.com"]')
      .forEach((node) => node.remove())
  }

  stripExternalBeacon()

  new MutationObserver(stripExternalBeacon).observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
})()
