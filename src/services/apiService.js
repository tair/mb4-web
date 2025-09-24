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
 */

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
   * Get authentication headers
   * @returns {Object} Headers object with authentication
   */
  getAuthHeaders() {
    const headers = { ...this.defaultHeaders }
    
    // Add authentication token if available
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  /**
   * Get authentication token from storage
   * @returns {string|null} Authentication token
   */
  getAuthToken() {
    // Try to get token from various sources
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token') || 
           this.getCookieValue('auth_token')
  }

  /**
   * Get cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value
   */
  getCookieValue(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
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

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - check for redirectUri in response data
        await this.handleUnauthorized(errorData)
        // Prefer server-provided message when available
        {
          const message = (errorData && (errorData.message || errorData.error)) || 'Authentication required'
          throw new Error(message)
        }
        
      case 403:
        throw new Error('Access forbidden')
        
      case 404:
        throw new Error('Resource not found')
        
      case 422:
        throw new Error(`Validation error: ${errorMessage}`)
        
      case 429:
        throw new Error('Too many requests. Please try again later.')
        
      case 500:
        throw new Error('Server error. Please try again later.')
        
      default:
        throw new Error(errorMessage || `HTTP ${response.status}`)
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
    
    // Clear stored tokens
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    
    // Import authStore and always trigger redirect to login for 401
    try {
      const { useAuthStore } = await import('@/stores/AuthStore.js')
      const authStore = useAuthStore()
      console.log('ApiService: Authentication error detected, redirecting to login')
      // Clear any local auth state if present
      try { authStore.invalidate() } catch {}
      // Ensure redirect to login regardless of prior auth state
      try { authStore.redirectToLoginIfNeeded() } catch {}
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
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)
    const config = {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
    const config = {
      method: 'POST',
      headers: this.getAuthHeaders(),
      ...options
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
    const config = {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      ...options
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
    const config = {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      ...options
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
    const config = {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      ...options
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

    const config = {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
        ...this.getAuthHeaders()
      },
      body: formData,
      ...options
    }

    // Remove Content-Type header for FormData
    delete config.headers['Content-Type']

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
