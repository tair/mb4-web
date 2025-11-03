/**
 * API Service
 * 
 * Centralized HTTP client for making API requests
 * Handles authentication, error handling, and request/response transformation
 * 
 * Features:
 * - Automatic 401 handling with redirectUri support (similar to axios interceptors)
 * - Blob response handling for authentication errors
 * - Token management and cleanup
 * - Comprehensive error handling for all HTTP methods
 * - Session tracking with headers for internal APIs only
 */

import sessionManager from '@/lib/session-manager.js'
import { isInternalApi } from '@/utils/session-utils.js'

class ApiService {
  constructor() {
    // Use empty string for relative URLs - works for most cases
    // If you need to configure a base URL, set it here manually
    this.baseUrl = ''
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }

  /**
   * Get default headers (base headers for all requests)
   * @returns {Object} Headers object
   */
  getDefaultHeaders() {
    // Return only base headers - session headers are added separately via getSessionHeaders
    return { ...this.defaultHeaders }
  }

  /**
   * Get session headers for internal API calls only
   * @param {string} url - The URL being called
   * @returns {Object} Session headers object (empty if external API)
   */
  getSessionHeaders(url) {
    // Skip session headers for external APIs (use shared utility)
    if (!isInternalApi(url)) {
      return {}
    }

    const headers = {}
    
    try {
      // Ensure session manager is initialized
      if (!sessionManager.initialized) {
        sessionManager.init()
      }
      
      // Auto-renew session if needed
      sessionManager.autoRenewIfNeeded()
      
      // Add session key header
      const sessionKey = sessionManager.getSessionKey()
      if (sessionKey) {
        headers['x-session-key'] = sessionKey
      }
      
      // Add fingerprint header for bot detection
      const fingerprint = sessionManager.getFingerprint()
      if (fingerprint) {
        headers['x-session-fingerprint'] = fingerprint
      }
      
      // Update session activity
      sessionManager.updateSessionActivity()
    } catch (error) {
      console.warn('Failed to add session headers:', error)
      // Continue without session headers - shouldn't break the request
    }
    
    return headers
  }


  /**
   * Build full URL - intelligently handles both relative and absolute URLs
   * @param {string} endpoint - API endpoint (relative path or full URL)
   * @param {Object} params - Optional query parameters
   * @returns {string} Full URL
   */
  buildUrl(endpoint, params = null) {
    // Check if it's already a full URL (has protocol)
    if (this.isFullUrl(endpoint)) {
      return this.appendQueryParams(endpoint, params)
    }
    
    // For relative URLs, build with API base URL
    const apiBaseUrl = import.meta.env.VITE_API_URL || ''
    
    // Ensure endpoint starts with / for relative paths
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    
    let fullUrl
    // If we have a configured baseUrl, use it (for testing/override scenarios)
    if (this.baseUrl) {
      const cleanEndpoint = normalizedEndpoint.startsWith('/') ? normalizedEndpoint.slice(1) : normalizedEndpoint
      fullUrl = `${this.baseUrl}/${cleanEndpoint}`
    }
    // Use VITE_API_URL for relative paths
    else if (apiBaseUrl) {
      fullUrl = `${apiBaseUrl}${normalizedEndpoint}`
    }
    // Fallback: return as relative to current origin
    else {
      fullUrl = normalizedEndpoint
    }
    
    return this.appendQueryParams(fullUrl, params)
  }

  /**
   * Append query parameters to a URL
   * @param {string} url - Base URL
   * @param {Object} params - Query parameters object
   * @returns {string} URL with query parameters
   */
  appendQueryParams(url, params) {
    if (!params || Object.keys(params).length === 0) {
      return url
    }
    
    const urlObj = new URL(url, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlObj.searchParams.set(key, value)
      }
    })
    
    return urlObj.toString()
  }

  /**
   * Check if a URL is a full URL (has protocol)
   * @param {string} url - URL to check
   * @returns {boolean} True if it's a full URL
   */
  isFullUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Force a URL to be treated as external/full URL (bypass API base URL)
   * Useful for S3, CIPRES, or other external service URLs
   * @param {string} url - The full URL
   * @returns {string} The URL unchanged (for chaining)
   */
  external(url) {
    // This is just a semantic helper - if the URL is already full, buildUrl will handle it correctly
    // But this makes the intent clear in the calling code
    return url
  }

  /**
   * Handle response errors
   * @param {Response} response - Fetch response
   * @returns {Response} Response if OK, throws error if not
   */
  async handleResponse(response) {
    if (response.ok) {
      return response
    }

    // Try to get error message from response
    let errorMessage = response.statusText
    let errorData = null
    
    try {
      errorData = await response.clone().json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch (e) {
      // If response is not JSON, try to handle as blob for 401 errors
      if (response.status === 401) {
        try {
          const blob = await response.clone().blob()
          const blobText = await blob.text()
          try {
            errorData = JSON.parse(blobText)
          } catch (parseError) {
            console.error('Error parsing blob response:', parseError)
          }
        } catch (blobError) {
          console.error('Error reading blob:', blobError)
        }
      }
    }

    // Create error with additional metadata
    const createError = (message, code, retry = false) => {
      const error = new Error(message)
      error.code = code
      error.retry = retry
      error.response = response
      error.data = errorData
      return error
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - check for redirectUri in response data
        await this.handleUnauthorized(errorData)
        // Prefer server-provided message when available
        {
          const message = (errorData && (errorData.message || errorData.error)) || 'Authentication required'
          throw createError(message, 'UNAUTHORIZED')
        }

      case 403: {
        // Access forbidden - raise a toast
        try {
          const { useNotifications } = await import('@/composables/useNotifications.ts')
          const { showError } = useNotifications()
          showError(
            (errorData && (errorData.message || errorData.error)) || 'You do not have permission to perform this action.',
            'Permission Denied'
          )
        } catch (e) {
          // Ignore if notifications fail to load
        }
        throw new Error('Access forbidden')
      }
      
      case 404:
        throw createError('Resource not found', 'NOT_FOUND')
      
      case 412:
        // Precondition failed - usually matrix editor sync connection required
        throw createError(
          (errorData && (errorData.message || errorData.errors?.[0])) || 'Precondition failed',
          errorData?.code || 'PRECONDITION_FAILED'
        )
        
      case 422:
        throw createError(`Validation error: ${errorMessage}`, 'VALIDATION_ERROR')
        
      case 429:
        throw createError('Too many requests. Please try again later.', 'RATE_LIMITED', true)
        
      case 500:
        // Check for database errors that should be retried
        if (errorData) {
          const { code, retry, details } = errorData
          
          // Handle specific database error codes
          if (code === 'DB_CONNECTION_ERROR' || code === 'DB_LOCK_TIMEOUT' || code === 'DB_DEADLOCK') {
            const userMessage = details || errorMessage || 'A temporary database issue occurred. Please try again.'
            throw createError(userMessage, code, retry !== false)
          }
          
          // Generic database error
          if (code === 'DB_ERROR') {
            throw createError(
              'Database operation failed. Please try again or contact support if the issue persists.',
              code,
              retry !== false
            )
          }
        }
        
        // Default server error
        throw createError('Server error. Please try again later.', 'SERVER_ERROR', true)

      default:
        // Check if response data includes retry information
        const shouldRetry = errorData?.retry === true
        const code = errorData?.code || 'UNKNOWN_ERROR'
        throw createError(errorMessage || `HTTP ${response.status}`, code, shouldRetry)
    }
  }

  /**
   * Handle unauthorized responses
   * @param {Object} errorData - Error response data that may contain redirectUri
   */
  async handleUnauthorized(errorData = null) {
    console.log('Interceptor caught error: 401')
    
    // Check if we have a redirectUri in the error response
    if (errorData && errorData.redirectUri) {
      // Redirect to the provided URI with current location as redirect parameter
      const redirectUrl = `${errorData.redirectUri}&redirect=${encodeURIComponent(window.location.href)}`
      console.log('Redirecting due to authentication required:', redirectUrl)
      window.location.href = redirectUrl
      return
    }
    
    // Clear stored user data (matches what AuthStore does)
    localStorage.removeItem('mb-user')
    localStorage.removeItem('orcid-user')
    
    // Import authStore and always trigger redirect to login for 401
    try {
      const { useAuthStore } = await import('@/stores/AuthStore.js')
      const authStore = useAuthStore()
      console.log('ApiService: Authentication error detected, redirecting to login')
      // Clear any local auth state if present
      try { authStore.invalidate() } catch {}
      // Ensure redirect to login regardless of prior auth state
      try { authStore.redirectToLoginIfNeeded() } catch {}

      // For matrix editor and other non-SPA contexts, force immediate redirect
      // The matrix editor takes over the DOM, preventing Vue Router navigation
      const isMatrixEditor = window.location.pathname.includes('/matrices/') && 
                            (window.location.pathname.includes('/edit') || window.location.pathname.includes('/view'))
      
      if (isMatrixEditor) {
        // Stop any ongoing matrix operations
        try {
          // Clear the app div to remove matrix editor DOM
          const appDiv = document.getElementById('app')
          if (appDiv) {
            appDiv.innerHTML = '<div>Redirecting to login...</div>'
          }
        } catch {}
        
        // Force immediate full page reload for matrix editor
        const loginUrl = new URL('/users/login', window.location.origin)
        // Pass only the pathname + search + hash, not the full URL
        const redirectPath = window.location.pathname + window.location.search + window.location.hash
        loginUrl.searchParams.set('redirectPath', redirectPath)
        
        // Use both replace and href as fallback
        try {
          window.location.replace(loginUrl.toString())
        } catch {
          window.location.href = loginUrl.toString()
        }
        
        // Final fallback - reload page after short delay
        setTimeout(() => {
          window.location.reload()
        }, 500)
        return
      }
      
      // For other pages, try SPA navigation first with fallback
      try {
        const alreadyOnLogin = window.location.pathname.includes('/users/login')
        if (!alreadyOnLogin) {
          // Store only the path, not the full URL
          const currentPath = window.location.pathname + window.location.search + window.location.hash
          // Give the SPA router a brief chance to handle navigation first
          setTimeout(() => {
            // If still not on login route, force navigation
            if (!window.location.pathname.includes('/users/login')) {
              // Build login URL with proper redirect parameter
              const loginUrl = new URL('/users/login', window.location.origin)
              loginUrl.searchParams.set('redirectPath', currentPath)
              window.location.replace(loginUrl.toString()) // Changed to replace() for more forceful navigation
            }
          }, 100)
        }
      } catch {}
    } catch (err) {
      console.warn('ApiService: Could not handle auth error:', err)
      // As a final fallback, navigate directly
      try {
        const { default: router } = await import('@/router/index.js')
        router.push({ name: 'UserLogin' })
      } catch {}
    }
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options (can include 'params' for query parameters)
   * @returns {Promise<Response>} Fetch response
   */
  async get(endpoint, options = {}) {
    const { params, headers: optionHeaders, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)
    const headers = { 
      ...this.getDefaultHeaders(), 
      ...this.getSessionHeaders(url),  // Add session headers for internal APIs only
      ...(optionHeaders || {}) 
    }
    const config = {
      method: 'GET',
      headers,
      credentials: 'include',
      ...fetchOptions
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse(response)
    } catch (error) {
      console.error('GET request failed:', error)
      throw error
    }
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async post(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint)
    const { headers: optionHeaders, ...otherOptions } = options
    const headers = { 
      ...this.getDefaultHeaders(), 
      ...this.getSessionHeaders(url),  // Add session headers for internal APIs only
      ...(optionHeaders || {}) 
    }
    const config = {
      method: 'POST',
      headers,
      credentials: 'include',
      ...otherOptions
    }

    if (data !== null) {
      if (data instanceof FormData) {
        // For FormData, don't set Content-Type (browser will set it with boundary)
        delete config.headers['Content-Type']
        config.body = data
      } else if (typeof data === 'object') {
        config.body = JSON.stringify(data)
      } else {
        config.body = data
      }
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse(response)
    } catch (error) {
      console.error('POST request failed:', error)
      throw error
    }
  }

  /**
   * Make PUT request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async put(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint)
    const { headers: optionHeaders, ...otherOptions } = options
    const headers = { 
      ...this.getDefaultHeaders(), 
      ...this.getSessionHeaders(url),  // Add session headers for internal APIs only
      ...(optionHeaders || {}) 
    }
    const config = {
      method: 'PUT',
      headers,
      credentials: 'include',
      ...otherOptions
    }

    if (data !== null) {
      if (data instanceof FormData) {
        delete config.headers['Content-Type']
        config.body = data
      } else if (typeof data === 'object') {
        config.body = JSON.stringify(data)
      } else {
        config.body = data
      }
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse(response)
    } catch (error) {
      console.error('PUT request failed:', error)
      throw error
    }
  }

  /**
   * Make PATCH request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async patch(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint)
    const { headers: optionHeaders, ...otherOptions } = options
    const headers = { 
      ...this.getDefaultHeaders(), 
      ...this.getSessionHeaders(url),  // Add session headers for internal APIs only
      ...(optionHeaders || {}) 
    }
    const config = {
      method: 'PATCH',
      headers,
      credentials: 'include',
      ...otherOptions
    }

    if (data !== null) {
      if (data instanceof FormData) {
        delete config.headers['Content-Type']
        config.body = data
      } else if (typeof data === 'object') {
        config.body = JSON.stringify(data)
      } else {
        config.body = data
      }
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse(response)
    } catch (error) {
      console.error('PATCH request failed:', error)
      throw error
    }
  }

  /**
   * Make DELETE request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request body data (optional)
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async delete(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint)
    const { headers: optionHeaders, ...otherOptions } = options
    const headers = { 
      ...this.getDefaultHeaders(), 
      ...this.getSessionHeaders(url),  // Add session headers for internal APIs only
      ...(optionHeaders || {}) 
    }
    const config = {
      method: 'DELETE',
      headers,
      credentials: 'include',
      ...otherOptions
    }

    if (data !== null) {
      if (data instanceof FormData) {
        delete config.headers['Content-Type']
        config.body = data
      } else if (typeof data === 'object') {
        config.body = JSON.stringify(data)
      } else {
        config.body = data
      }
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse(response)
    } catch (error) {
      console.error('DELETE request failed:', error)
      throw error
    }
  }

  /**
   * Upload file with progress tracking
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Response>} Fetch response
   */
  async uploadFile(endpoint, file, options = {}) {
    const url = this.buildUrl(endpoint)
    const formData = new FormData()
    formData.append('file', file)
    
    // Add additional form fields if provided
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const { headers: optionHeaders, ...otherOptions } = options
    const headers = { 
      ...this.getDefaultHeaders(),
      ...this.getSessionHeaders(url),  // Add session headers for internal APIs only
      ...(optionHeaders || {}) 
    }
    
    // Remove Content-Type header for FormData (browser sets it with boundary)
    delete headers['Content-Type']
    
    const config = {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
      ...otherOptions
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse(response)
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }
  }

  /**
   * Download file
   * @param {string} endpoint - API endpoint
   * @param {string} filename - Suggested filename
   * @param {Object} options - Request options
   * @returns {Promise<void>}
   */
  async downloadFile(endpoint, filename = null, options = {}) {
    try {
      const response = await this.get(endpoint, options)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }

  /**
   * Check if endpoint is available
   * @param {string} endpoint - API endpoint
   * @returns {Promise<boolean>} True if endpoint is available
   */
  async isAvailable(endpoint) {
    try {
      const response = await this.get(endpoint)
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Get request with timeout
   * @param {string} endpoint - API endpoint
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async getWithTimeout(endpoint, timeoutMs = 5000, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await this.get(endpoint, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService()

// Also export the class for testing
export { ApiService }
