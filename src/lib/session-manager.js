/**
 * Session Management Library
 * Implements client-side session generation and management without database changes
 * Based on existing infrastructure analysis from Specifications.txt
 */

class SessionManager {
  constructor() {
    this.sessionKey = null
    this.fingerprint = null
    this.init()
  }

  /**
   * Initialize session manager
   */
  init() {
    this.loadOrCreateSession()
    this.generateFingerprint()
  }

  /**
   * Load existing session or create new one
   */
  loadOrCreateSession() {
    // Try to load existing session from localStorage
    const storedSession = localStorage.getItem('mb-session-key')
    
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
    localStorage.setItem('mb-session-key', this.sessionKey)
    localStorage.setItem('mb-session-created', Date.now().toString())
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
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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
    localStorage.setItem('mb-session-activity', Date.now().toString())
  }

  /**
   * Get current session key
   */
  getSessionKey() {
    return this.sessionKey
  }

  /**
   * Generate browser fingerprint for bot detection
   */
  generateFingerprint() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Session fingerprint', 2, 2)
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      memory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      timestamp: Date.now()
    }

    this.fingerprint = btoa(JSON.stringify(fingerprint))
    return this.fingerprint
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
    const created = localStorage.getItem('mb-session-created')
    const activity = localStorage.getItem('mb-session-activity')
    
    return {
      sessionKey: this.sessionKey,
      created: created ? parseInt(created) : null,
      lastActivity: activity ? parseInt(activity) : null,
      fingerprint: this.fingerprint
    }
  }

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem('mb-session-key')
    localStorage.removeItem('mb-session-created')
    localStorage.removeItem('mb-session-activity')
    this.sessionKey = null
  }

  /**
   * Check if session should be renewed (e.g., after 24 hours)
   */
  shouldRenewSession() {
    const created = localStorage.getItem('mb-session-created')
    if (!created) return true
    
    const sessionAge = Date.now() - parseInt(created)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    return sessionAge > maxAge
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