/**
 * API Service
 * 
 * Centralized HTTP client for making API requests
 * Handles authentication, error handling, and request/response transformation
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
   * Build full URL
   * @param {string} endpoint - API endpoint
   * @returns {string} Full URL
   */
  buildUrl(endpoint) {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    
    if (this.baseUrl) {
      return `${this.baseUrl}/${cleanEndpoint}`
    }
    
    // If no base URL, assume endpoint is already a full URL or relative to current origin
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`
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
    try {
      const errorData = await response.clone().json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch (e) {
      // If response is not JSON, use statusText
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - redirect to login or refresh token
        this.handleUnauthorized()
        throw new Error('Authentication required')
        
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
   */
  handleUnauthorized() {
    // Clear stored tokens
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    
    // Import authStore to handle session timeout properly
    import('@/stores/AuthStore.js').then(({ useAuthStore }) => {
      const authStore = useAuthStore()
      // Only handle if we have auth data
      if (authStore.user?.authToken) {
        console.log('ApiService: Authentication error detected, clearing auth state')
        authStore.invalidate()
        // The authStore.invalidate() will trigger the redirect via axios interceptor
      }
    }).catch(err => {
      console.warn('ApiService: Could not handle auth error:', err)
    })
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   */
  async get(endpoint, options = {}) {
    const url = this.buildUrl(endpoint)
    const config = {
      method: 'GET',
      headers: this.getAuthHeaders(),
      ...options
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
