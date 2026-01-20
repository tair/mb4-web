import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiService } from '@/services/apiService.js'

/**
 * Composable for auto-populating copyright fields from existing specimen images
 * 
 * Features:
 * - Toggle state (always starts unchecked on page load)
 * - Fetches most recent copyright for a specimen
 * - Returns copyright data ready to populate form fields
 */
export function useCopyrightAutopopulate() {
  const route = useRoute()
  const projectId = computed(() => route.params.id)
  
  // Toggle state - always starts unchecked on new page load
  const isEnabled = ref(false)
  
  // Set the enabled state
  function setEnabled(value) {
    isEnabled.value = value
  }
  
  // Toggle the enabled state
  function toggle() {
    isEnabled.value = !isEnabled.value
  }
  
  /**
   * Fetch the most recent copyright for a specimen
   * @param {number} specimenId - The specimen ID
   * @returns {Promise<Object|null>} Copyright data or null if none found
   */
  async function fetchCopyrightForSpecimen(specimenId) {
    if (!specimenId || !projectId.value) {
      return null
    }
    
    try {
      const response = await apiService.get(
        `/projects/${projectId.value}/specimens/${specimenId}/copyright`
      )
      
      if (!response.ok) {
        // If 404 or other error, just return null (no copyright found)
        return null
      }
      
      const data = await response.json()
      return data.copyright || null
    } catch (error) {
      console.error('Error fetching copyright for specimen:', error)
      // Don't show error to user - this is a background operation
      // Just return null to indicate no copyright found
      return null
    }
  }
  
  return {
    isEnabled: computed(() => isEnabled.value),
    setEnabled,
    toggle,
    fetchCopyrightForSpecimen
  }
}

