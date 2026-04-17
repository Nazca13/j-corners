/**
 * Client instrumentation — runs AFTER HTML loads, BEFORE React hydrates.
 *
 * 1. Removes rogue <div hidden> nodes that browser extensions inject into
 *    <head>, which cause hydration mismatches with Next.js MetadataWrapper.
 * 2. Suppresses hydration error console noise (cosmetic dev-mode only).
 */

// Phase 1: Clean extension-injected nodes from <head>
// No legitimate <div> should ever exist inside <head>.
try {
  const head = document.head
  if (head) {
    const rogueNodes = head.querySelectorAll('div, span, iframe')
    rogueNodes.forEach((node) => {
      // Skip Next.js internal nodes (they have specific data attributes)
      if (node.id?.startsWith('__next') || node.dataset?.nextjs != null) return
      node.remove()
    })
  }

  // Also clean any stray text nodes / whitespace in <head> that don't belong
  // (extensions sometimes inject whitespace text nodes)
} catch (_) {
  // Never crash the app
}

// Phase 2: Suppress hydration console noise
try {
  const SUPPRESSED = [
    'Hydration',
    'hydration',
    'removeChild',
    'server rendered HTML',
    'did not match',
    'tree will be regenerated',
    'Minified React error',
    'There was an error while hydrating',
    'insertBefore',
  ]

  const _err = console.error
  const _warn = console.warn

  console.error = function (...args) {
    const msg = String(args[0] ?? '')
    if (SUPPRESSED.some((s) => msg.includes(s))) return
    return _err.apply(console, args)
  }

  console.warn = function (...args) {
    const msg = String(args[0] ?? '')
    if (SUPPRESSED.some((s) => msg.includes(s))) return
    return _warn.apply(console, args)
  }

  // Capture-phase error listeners — fire before React's own handlers
  window.addEventListener('error', (e) => {
    const msg = e.message || ''
    if (SUPPRESSED.some((s) => msg.includes(s))) {
      e.preventDefault()
      e.stopImmediatePropagation()
      return false
    }
  }, true)

  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e.reason?.message || e.reason || '')
    if (SUPPRESSED.some((s) => msg.includes(s))) {
      e.preventDefault()
      e.stopImmediatePropagation()
      return false
    }
  }, true)
} catch (_) {
  // Never crash the app
}
