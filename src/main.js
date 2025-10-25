import 'bootstrap/dist/css/bootstrap.css'

import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fortawesome/fontawesome-free/js/all.min.js'

import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'

import './assets/global.css'

import App from './App.vue'
import { createApp } from 'vue'
const app = createApp(App)

import { createPinia } from 'pinia'
app.use(createPinia())

import router from './router'
app.use(router)

// Session Management Setup
import sessionManager from './lib/session-manager.js'
import axios from 'axios'

// Initialize session manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  sessionManager.init()
})

// Fallback initialization for cases where DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, event listener will handle it
} else {
  // DOM is already loaded, initialize immediately
  sessionManager.init()
}

// Set up axios interceptors for automatic session header injection
axios.interceptors.request.use(
  (config) => {
    console.log('[AXIOS-INTERCEPTOR-DEBUG] Request interceptor - outgoing request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials
    })

    // Skip session headers for public endpoints (if explicitly marked)
    if (config.skipSessionHeaders) {
      console.log('[AXIOS-INTERCEPTOR-DEBUG] Skipping session headers (marked as public)')
      return config
    }

    // Ensure session manager is initialized before using it
    if (!sessionManager.initialized) {
      console.log('[AXIOS-INTERCEPTOR-DEBUG] Initializing session manager')
      sessionManager.init()
    }

    try {
      // Auto-renew session if needed before making requests
      sessionManager.autoRenewIfNeeded()

      // Add session key header to all requests
      const sessionKey = sessionManager.getSessionKey()
      if (sessionKey) {
        config.headers['x-session-key'] = sessionKey
        console.log('[AXIOS-INTERCEPTOR-DEBUG] Added session key header')
      } else {
        console.log('[AXIOS-INTERCEPTOR-DEBUG] No session key available')
      }

      // Add fingerprint header for bot detection
      const fingerprint = sessionManager.getFingerprint()
      if (fingerprint) {
        config.headers['x-session-fingerprint'] = fingerprint
        console.log('[AXIOS-INTERCEPTOR-DEBUG] Added fingerprint header')
      }

      // Update session activity on each request
      sessionManager.updateSessionActivity()
    } catch (error) {
      console.warn(
        '[AXIOS-INTERCEPTOR-DEBUG] Session management failed in request interceptor:',
        error.message
      )
      // Continue with request even if session operations fail
    }

    console.log('[AXIOS-INTERCEPTOR-DEBUG] Final request config:', {
      url: config.url,
      headers: config.headers
    })

    return config
  },
  (error) => {
    console.error('[AXIOS-INTERCEPTOR-DEBUG] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Set up response interceptor for session and authentication error handling
axios.interceptors.response.use(
  (response) => {
    console.log('[AXIOS-INTERCEPTOR-DEBUG] Response received:', {
      status: response.status,
      url: response.config?.url,
      statusText: response.statusText
    })
    return response
  },
  (error) => {
    console.error('[AXIOS-INTERCEPTOR-DEBUG] Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    })

    // Handle session-related errors (e.g., if server requests session renewal)
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.renewSession
    ) {
      console.log('[AXIOS-INTERCEPTOR-DEBUG] Server requested session renewal')
      sessionManager.renewSession()
      // Optionally retry the request with new session
    }
    
    // Handle authentication errors by clearing local auth state and redirecting to login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('[AXIOS-INTERCEPTOR-DEBUG] 🚨 Authentication error detected (401/403)')
      // Import authStore and router dynamically to avoid circular dependency
      Promise.all([
        import('./stores/AuthStore.js'),
        import('./router/index.js')
      ]).then(([{ useAuthStore }, { default: router }]) => {
        const authStore = useAuthStore()
        console.log('[AXIOS-INTERCEPTOR-DEBUG] Auth store loaded, checking user state')
        console.log('[AXIOS-INTERCEPTOR-DEBUG] Has auth token:', !!authStore.user?.authToken)
        
        // Only handle auth errors if we have auth data (to avoid clearing on public endpoints)
        if (authStore.user?.authToken) {
          console.error('[AXIOS-INTERCEPTOR-DEBUG] User has token, clearing auth state and redirecting')
          authStore.invalidate()
          
          // Redirect to login page with current route as redirect parameter
          const currentRoute = router.currentRoute.value
          console.log('[AXIOS-INTERCEPTOR-DEBUG] Current route:', currentRoute.name)
          
          if (currentRoute.name !== 'UserLogin') {
            console.log('[AXIOS-INTERCEPTOR-DEBUG] Redirecting to login')
            router.push({ 
              name: 'UserLogin', 
              query: { 
                redirect: currentRoute.name,
                // Preserve query params if they exist
                ...(Object.keys(currentRoute.query).length > 0 ? { originalQuery: JSON.stringify(currentRoute.query) } : {})
              } 
            })
          }
        } else {
          console.log('[AXIOS-INTERCEPTOR-DEBUG] No auth token present, skipping redirect (likely public endpoint)')
        }
      }).catch(err => {
        console.error('[AXIOS-INTERCEPTOR-DEBUG] Could not handle auth error:', err)
      })
    }
    
    return Promise.reject(error)
  }
)

app.use(VueTippy, {
  defaultProps: {
    placement: 'bottom-end',
    hideOnClick: false,
    arrow: true,
    theme: 'light',
    maxWidth: 500,
  },
})

app.mount('#app')
