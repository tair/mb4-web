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
import { isInternalApi } from './utils/session-utils.js'
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

// Set up axios interceptors for session management
axios.interceptors.request.use(
  (config) => {
    // Check if this is an internal API call
    const isInternal = isInternalApi(config.url)
    
    // Only add session headers for internal APIs
    if (isInternal) {
      // Ensure session manager is initialized before using it
      if (!sessionManager.initialized) {
        sessionManager.init()
      }

      try {
        // Auto-renew session if needed before making requests
        sessionManager.autoRenewIfNeeded()

        // Add session key header to internal API requests
        const sessionKey = sessionManager.getSessionKey()
        if (sessionKey) {
          config.headers['x-session-key'] = sessionKey
        }

        // Add fingerprint header for bot detection
        const fingerprint = sessionManager.getFingerprint()
        if (fingerprint) {
          config.headers['x-session-fingerprint'] = fingerprint
        }

        // Update session activity on each request
        sessionManager.updateSessionActivity()
      } catch (error) {
        console.warn(
          'Session management failed in request interceptor:',
          error.message
        )
        // Continue with request even if session operations fail
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Set up response interceptor for session and authentication error handling
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle session-related errors (e.g., if server requests session renewal)
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.renewSession
    ) {
      sessionManager.renewSession()
      // Optionally retry the request with new session
    }
    
    // Handle authentication errors by clearing local auth state and redirecting to login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Import authStore and router dynamically to avoid circular dependency
      Promise.all([
        import('./stores/AuthStore.js'),
        import('./router/index.js')
      ]).then(([{ useAuthStore }, { default: router }]) => {
        const authStore = useAuthStore()
        // Only handle auth errors if we have auth data (to avoid clearing on public endpoints)
        if (authStore.user?.authToken) {
          console.log('Authentication error detected, clearing local auth state and redirecting to login')
          authStore.invalidate()
          
          // Redirect to login page with current route as redirect parameter
          const currentRoute = router.currentRoute.value
          if (currentRoute.name !== 'UserLogin') {
            router.push({ 
              name: 'UserLogin', 
              query: { 
                redirect: currentRoute.name,
                // Preserve query params if they exist
                ...(Object.keys(currentRoute.query).length > 0 ? { originalQuery: JSON.stringify(currentRoute.query) } : {})
              } 
            })
          }
        }
      }).catch(err => {
        console.warn('Could not handle auth error:', err)
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
