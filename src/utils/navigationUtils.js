/**
 * Navigation utilities for handling router failures and ensuring reliable navigation
 * especially after creating new resources
 */
import router from '@/router'

/**
 * Reliably navigate after creating a new resource
 * Handles router failures and provides fallbacks
 * 
 * @param {string} path - The path to navigate to
 * @param {Object} options - Navigation options
 * @param {boolean} options.replace - Use router.replace instead of router.push (default: false)
 * @param {number} options.delay - Delay before navigation in ms (default: 0)
 * @param {boolean} options.forceReload - Force full page reload (default: false)
 * @param {Function} options.beforeNavigation - Async function to run before navigation
 */
export async function navigateAfterCreate(path, options = {}) {
  const {
    replace = false,
    delay = 0,
    forceReload = false,
    beforeNavigation = null
  } = options

  try {
    // Run any pre-navigation tasks (like store invalidation)
    if (beforeNavigation) {
      await beforeNavigation()
    }

    // Add delay if specified (useful for allowing success messages to show)
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // If force reload is requested, use window.location
    if (forceReload) {
      window.location.href = path
      return
    }

    // Try router navigation first
    const navigationMethod = replace ? router.replace : router.push
    await navigationMethod({ path })
    
  } catch (navigationError) {
    console.warn('Router navigation failed, falling back to window.location:', navigationError)
    
    // Fallback to window.location if router fails
    window.location.href = path
  }
}

/**
 * Navigate back with fallback
 * Use this instead of router.go(-1) for better reliability
 * 
 * @param {string} fallbackPath - Path to navigate to if going back fails
 */
export async function navigateBack(fallbackPath) {
  try {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.go(-1)
    } else {
      // No history, use fallback
      await navigateAfterCreate(fallbackPath)
    }
  } catch (error) {
    console.warn('Going back failed, using fallback path:', error)
    await navigateAfterCreate(fallbackPath)
  }
}

/**
 * Determine the appropriate navigation method based on the operation type
 * 
 * @param {string} operationType - Type of operation ('create', 'edit', 'list_operation')
 * @returns {boolean} Whether to use router.replace
 */
export function shouldUseReplace(operationType) {
  // Use replace for operations where user shouldn't return to the form
  return operationType === 'list_operation' || operationType === 'batch_create'
}

/**
 * Standard navigation for different operation types
 */
export const NavigationPatterns = {
  /**
   * After creating a single item - user might want to go back to create more
   */
  afterCreate: (projectId, resourceType, options = {}) => {
    const replace = shouldUseReplace('create')
    return navigateAfterCreate(`/myprojects/${projectId}/${resourceType}`, {
      replace,
      ...options
    })
  },

  /**
   * After editing an item - user usually doesn't need to return to edit form
   */
  afterEdit: (projectId, resourceType, options = {}) => {
    return navigateAfterCreate(`/myprojects/${projectId}/${resourceType}`, {
      replace: true,
      ...options
    })
  },

  /**
   * After batch operations - user shouldn't return to batch form
   */
  afterBatchOperation: (projectId, resourceType, options = {}) => {
    return navigateAfterCreate(`/myprojects/${projectId}/${resourceType}`, {
      replace: true,
      ...options
    })
  },

  /**
   * After project creation - needs special handling for cache issues
   */
  afterProjectCreate: (projectId, options = {}) => {
    return navigateAfterCreate(`/myprojects/${projectId}/overview`, {
      forceReload: true, // Projects often have caching issues
      delay: 800, // Allow success message to show
      ...options
    })
  },

  /**
   * After complex resource creation (media, matrices) that might need caching bypass
   */
  afterComplexResourceCreate: (projectId, resourceType, options = {}) => {
    return navigateAfterCreate(`/myprojects/${projectId}/${resourceType}`, {
      forceReload: true,
      delay: 100,
      ...options
    })
  }
}
