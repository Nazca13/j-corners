/**
 * Safe localStorage wrapper.
 * Prevents crashes in incognito mode, Safari Private Browsing,
 * SSR, or when storage quota is exceeded.
 */

export function getLS(key, fallback = null) {
  try {
    if (typeof window === 'undefined') return fallback
    const val = localStorage.getItem(key)
    return val !== null ? val : fallback
  } catch {
    return fallback
  }
}

export function setLS(key, value) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  } catch {
    // Storage full or disabled — silently fail
  }
}

export function getLSJSON(key, fallback = []) {
  try {
    if (typeof window === 'undefined') return fallback
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function setLSJSON(key, value) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or disabled — silently fail
  }
}

export function removeLS(key) {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}
