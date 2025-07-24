/**
 * Session Management Library
 * Implements client-side session generation and management without database changes
 * Based on existing infrastructure analysis from Specifications.txt
 */

// Configuration constants
const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  STORAGE_PREFIX: 'mb-session',
  CANVAS_TEXT: 'Session fingerprint',
  CANVAS_FONT: '14px Arial',
}

class SessionManager {
  constructor() {
    this.sessionKey = null
    this.fingerprint = null
    this.storageAvailable = false
    this.initialized = false
    // Don't auto-initialize - wait for explicit call
  }

  /**
   * Check if localStorage is available and working
   */
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.storageAvailable = true
      return true
    } catch (error) {
      console.warn(
        'localStorage not available, using memory-only session:',
        error.message
      )
      this.storageAvailable = false
      return false
    }
  }

  /**
   * Safe localStorage operations with fallbacks
   */
  safeSetItem(key, value) {
    if (this.storageAvailable) {
      try {
        localStorage.setItem(key, value)
        return true
      } catch (error) {
        console.warn('Failed to write to localStorage:', error.message)
        this.storageAvailable = false
      }
    }
    // Fallback: store in memory (will not persist across page reloads)
    this[`_memory_${key}`] = value
    return false
  }

  safeGetItem(key) {
    if (this.storageAvailable) {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('Failed to read from localStorage:', error.message)
        this.storageAvailable = false
      }
    }
    // Fallback: get from memory
    return this[`_memory_${key}`] || null
  }

  safeRemoveItem(key) {
    if (this.storageAvailable) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error.message)
        this.storageAvailable = false
      }
    }
    // Fallback: remove from memory
    delete this[`_memory_${key}`]
  }

  /**
   * Initialize session manager (call explicitly when ready)
   */
  init() {
    if (this.initialized) {
      return // Already initialized
    }

    try {
      this.checkStorageAvailability()
      this.loadOrCreateSession()
      this.generateFingerprint()
      this.initialized = true
    } catch (error) {
      console.error('Session manager initialization failed:', error)
      // Create minimal fallback session
      this.sessionKey = this.generateSecureSessionId()
      this.fingerprint = 'fallback-fingerprint'
      this.initialized = true
    }
  }

  /**
   * Load existing session or create new one
   */
  loadOrCreateSession() {
    // Try to load existing session from localStorage
    const storedSession = this.safeGetItem(
      `${SESSION_CONFIG.STORAGE_PREFIX}-key`
    )

    if (storedSession && this.isValidSessionKey(storedSession)) {
      this.sessionKey = storedSession
      this.updateSessionActivity()
    } else {
      this.createNewSession()
    }
  }

  /**
   * Create a new session
   */
  createNewSession() {
    this.sessionKey = this.generateSecureSessionId()
    this.safeSetItem(`${SESSION_CONFIG.STORAGE_PREFIX}-key`, this.sessionKey)
    this.safeSetItem(
      `${SESSION_CONFIG.STORAGE_PREFIX}-created`,
      Date.now().toString()
    )
    this.updateSessionActivity()
  }

  /**
   * Generate cryptographically secure session ID
   * Database expects char(32), so we generate 16 bytes = 32 hex characters
   */
  generateSecureSessionId() {
    // Use crypto.getRandomValues for secure random generation
    const array = new Uint8Array(16) // 16 bytes = 32 hex characters (to fit char(32))
    crypto.getRandomValues(array)

    // Convert to hex string
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    )
  }

  /**
   * Validate session key format
   */
  isValidSessionKey(sessionKey) {
    // Check if it's a 32-character hex string (16 bytes) to match database char(32)
    return /^[a-f0-9]{32}$/i.test(sessionKey)
  }

  /**
   * Update session activity timestamp
   */
  updateSessionActivity() {
    this.safeSetItem(
      `${SESSION_CONFIG.STORAGE_PREFIX}-activity`,
      Date.now().toString()
    )
  }

  /**
   * Get current session key
   */
  getSessionKey() {
    return this.sessionKey
  }

  /**
   * Generate browser fingerprint for bot detection with error handling
   */
  generateFingerprint() {
    try {
      let canvasData = 'unavailable'

      // Safely generate canvas fingerprint
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.textBaseline = 'top'
          ctx.font = SESSION_CONFIG.CANVAS_FONT
          ctx.fillText(SESSION_CONFIG.CANVAS_TEXT, 2, 2)
          canvasData = canvas.toDataURL()
        }
      } catch (canvasError) {
        console.warn('Canvas fingerprinting failed:', canvasError.message)
      }

      const fingerprint = {
        userAgent: navigator.userAgent || 'unknown',
        language: navigator.language || 'unknown',
        platform: navigator.platform || 'unknown',
        screen: this.safeGetScreenInfo(),
        timezone: this.safeGetTimezone(),
        canvas: canvasData,
        memory: navigator.deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        cookieEnabled: this.safeCookieCheck(),
        doNotTrack: navigator.doNotTrack || 'unknown',
        timestamp: Date.now(),
      }

      this.fingerprint = btoa(JSON.stringify(fingerprint))
      return this.fingerprint
    } catch (error) {
      console.warn(
        'Fingerprint generation failed, using fallback:',
        error.message
      )
      this.fingerprint = btoa(
        JSON.stringify({
          fallback: true,
          timestamp: Date.now(),
          error: error.message,
        })
      )
      return this.fingerprint
    }
  }

  /**
   * Safely get screen information
   */
  safeGetScreenInfo() {
    try {
      return `${screen.width}x${screen.height}x${screen.colorDepth}`
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Safely get timezone information
   */
  safeGetTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Safely check cookie availability
   */
  safeCookieCheck() {
    try {
      return navigator.cookieEnabled
    } catch (error) {
      return false
    }
  }

  /**
   * Get browser fingerprint
   */
  getFingerprint() {
    return this.fingerprint
  }

  /**
   * Renew session (generate new session key)
   */
  renewSession() {
    this.createNewSession()
  }

  /**
   * Get session metadata
   */
  getSessionMetadata() {
    const created = this.safeGetItem(`${SESSION_CONFIG.STORAGE_PREFIX}-created`)
    const activity = this.safeGetItem(
      `${SESSION_CONFIG.STORAGE_PREFIX}-activity`
    )

    return {
      sessionKey: this.sessionKey,
      created: created ? parseInt(created) : null,
      lastActivity: activity ? parseInt(activity) : null,
      fingerprint: this.fingerprint,
      storageAvailable: this.storageAvailable,
    }
  }

  /**
   * Clear session
   */
  clearSession() {
    this.safeRemoveItem(`${SESSION_CONFIG.STORAGE_PREFIX}-key`)
    this.safeRemoveItem(`${SESSION_CONFIG.STORAGE_PREFIX}-created`)
    this.safeRemoveItem(`${SESSION_CONFIG.STORAGE_PREFIX}-activity`)
    this.sessionKey = null
  }

  /**
   * Check if session should be renewed (e.g., after 24 hours)
   */
  shouldRenewSession() {
    const created = this.safeGetItem(`${SESSION_CONFIG.STORAGE_PREFIX}-created`)
    if (!created) return true

    const sessionAge = Date.now() - parseInt(created)
    return sessionAge > SESSION_CONFIG.MAX_AGE
  }

  /**
   * Auto-renew session if needed
   */
  autoRenewIfNeeded() {
    if (this.shouldRenewSession()) {
      this.renewSession()
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager()

export default sessionManager
