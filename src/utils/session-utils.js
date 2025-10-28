/**
 * Session Utilities
 * Shared utilities for session management across the application
 */

/**
 * Check if URL is an internal API call (should get session headers)
 * Only VITE_HOST and VITE_API_URL are considered internal
 * @param {string} url - URL to check
 * @returns {boolean} True if internal API
 */
export function isInternalApi(url) {
  try {
    // Whitelist of internal API base URLs that SHOULD get session headers
    const internalApis = [
      import.meta.env.VITE_HOST,
      import.meta.env.VITE_API_URL,
    ].filter(Boolean) // Remove undefined values

    // If no URL provided, default to not internal
    if (!url) return false

    // Helper to check if URL is a full URL (has protocol)
    const isFullUrl = (testUrl) => {
      try {
        new URL(testUrl)
        return true
      } catch {
        return false
      }
    }

    // If no internal APIs configured, treat relative URLs as internal
    if (internalApis.length === 0) {
      // Relative URLs are internal
      return !isFullUrl(url)
    }

    // If URL is relative, it's going to our app (internal)
    if (!isFullUrl(url)) {
      return true
    }

    // For full URLs, check if it matches any internal API base
    for (const internalApi of internalApis) {
      if (url.startsWith(internalApi)) {
        return true // Matches internal API - add session headers
      }
    }

    // Check if it's same origin as our app
    try {
      const urlObj = new URL(url, window.location.origin)
      if (urlObj.origin === window.location.origin) {
        return true
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Not in whitelist - don't add session headers
    return false
  } catch (error) {
    console.warn('Error checking if URL is internal:', error)
    // Default to NOT internal (safer to exclude headers for unknown URLs)
    return false
  }
}

