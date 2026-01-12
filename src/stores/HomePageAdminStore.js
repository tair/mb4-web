import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/apiService.js'

export const useHomePageAdminStore = defineStore('homePageAdmin', () => {
  // State
  const tools = ref([])
  const announcements = ref([])
  const matrixImages = ref([])
  const featuredProjects = ref([])
  const press = ref([])
  const publishedProjects = ref([])

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref(null)

  // Getters
  const activeAnnouncements = computed(() =>
    announcements.value.filter((a) => a.isActive)
  )

  const featuredProjectCount = computed(() => featuredProjects.value.length)

  // Actions
  async function fetchAllContent() {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/homepage')
      const data = await response.json()
      if (data.success) {
        tools.value = data.data.tools || []
        announcements.value = data.data.announcements || []
        matrixImages.value = data.data.matrixImages || []
        featuredProjects.value = data.data.featuredProjects || []
        press.value = data.data.press || []
        publishedProjects.value = data.data.publishedProjects || []
      } else {
        throw new Error(data.message || 'Failed to fetch homepage content')
      }
    } catch (err) {
      console.error('Error fetching homepage content:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================================================
  // TOOLS ACTIONS
  // ==========================================================================

  async function createTool(formData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.post('/admin/homepage/tools', formData)
      const data = await response.json()
      if (data.success) {
        tools.value.unshift(data.data)
        return data.data
      } else {
        throw new Error(data.message || 'Failed to create tool')
      }
    } catch (err) {
      console.error('Error creating tool:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateTool(toolId, formData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.put(
        `/admin/homepage/tools/${toolId}`,
        formData
      )
      const data = await response.json()
      if (data.success) {
        const index = tools.value.findIndex((t) => t.tool_id === toolId)
        if (index !== -1) {
          tools.value[index] = data.data
        }
        return data.data
      } else {
        throw new Error(data.message || 'Failed to update tool')
      }
    } catch (err) {
      console.error('Error updating tool:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteTool(toolId) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.delete(`/admin/homepage/tools/${toolId}`)
      const data = await response.json()
      if (data.success) {
        tools.value = tools.value.filter((t) => t.tool_id !== toolId)
      } else {
        throw new Error(data.message || 'Failed to delete tool')
      }
    } catch (err) {
      console.error('Error deleting tool:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // ==========================================================================
  // ANNOUNCEMENTS ACTIONS
  // ==========================================================================

  async function createAnnouncement(announcementData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.post(
        '/admin/homepage/announcements',
        announcementData
      )
      const data = await response.json()
      if (data.success) {
        announcements.value.unshift(data.data)
        return data.data
      } else {
        throw new Error(data.message || 'Failed to create announcement')
      }
    } catch (err) {
      console.error('Error creating announcement:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateAnnouncement(announcementId, announcementData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.put(
        `/admin/homepage/announcements/${announcementId}`,
        announcementData
      )
      const data = await response.json()
      if (data.success) {
        const index = announcements.value.findIndex(
          (a) => a.announcement_id === announcementId
        )
        if (index !== -1) {
          announcements.value[index] = data.data
        }
        return data.data
      } else {
        throw new Error(data.message || 'Failed to update announcement')
      }
    } catch (err) {
      console.error('Error updating announcement:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteAnnouncement(announcementId) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.delete(
        `/admin/homepage/announcements/${announcementId}`
      )
      const data = await response.json()
      if (data.success) {
        announcements.value = announcements.value.filter(
          (a) => a.announcement_id !== announcementId
        )
      } else {
        throw new Error(data.message || 'Failed to delete announcement')
      }
    } catch (err) {
      console.error('Error deleting announcement:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // ==========================================================================
  // MATRIX IMAGES ACTIONS
  // ==========================================================================

  async function createMatrixImage(formData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.post(
        '/admin/homepage/matrix-images',
        formData
      )
      const data = await response.json()
      if (data.success) {
        matrixImages.value.unshift(data.data)
        return data.data
      } else {
        throw new Error(data.message || 'Failed to create matrix image')
      }
    } catch (err) {
      console.error('Error creating matrix image:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteMatrixImage(imageId) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.delete(
        `/admin/homepage/matrix-images/${imageId}`
      )
      const data = await response.json()
      if (data.success) {
        matrixImages.value = matrixImages.value.filter(
          (m) => m.image_id !== imageId
        )
      } else {
        throw new Error(data.message || 'Failed to delete matrix image')
      }
    } catch (err) {
      console.error('Error deleting matrix image:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // ==========================================================================
  // FEATURED PROJECTS ACTIONS
  // ==========================================================================

  async function addFeaturedProject(projectId) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.post(
        '/admin/homepage/featured-projects',
        { projectId }
      )
      const data = await response.json()
      if (data.success) {
        featuredProjects.value.unshift(data.data)
        return data.data
      } else {
        throw new Error(data.message || 'Failed to add featured project')
      }
    } catch (err) {
      console.error('Error adding featured project:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function removeFeaturedProject(featuredProjectId) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.delete(
        `/admin/homepage/featured-projects/${featuredProjectId}`
      )
      const data = await response.json()
      if (data.success) {
        featuredProjects.value = featuredProjects.value.filter(
          (f) => f.featured_project_id !== featuredProjectId
        )
      } else {
        throw new Error(data.message || 'Failed to remove featured project')
      }
    } catch (err) {
      console.error('Error removing featured project:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // ==========================================================================
  // PRESS ACTIONS
  // ==========================================================================

  async function createPress(formData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.post('/admin/homepage/press', formData)
      const data = await response.json()
      if (data.success) {
        press.value.unshift(data.data)
        return data.data
      } else {
        throw new Error(data.message || 'Failed to create press item')
      }
    } catch (err) {
      console.error('Error creating press item:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updatePress(pressId, formData) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.put(
        `/admin/homepage/press/${pressId}`,
        formData
      )
      const data = await response.json()
      if (data.success) {
        const index = press.value.findIndex((p) => p.press_id === pressId)
        if (index !== -1) {
          press.value[index] = data.data
        }
        return data.data
      } else {
        throw new Error(data.message || 'Failed to update press item')
      }
    } catch (err) {
      console.error('Error updating press item:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deletePress(pressId) {
    isSaving.value = true
    error.value = null
    try {
      const response = await apiService.delete(`/admin/homepage/press/${pressId}`)
      const data = await response.json()
      if (data.success) {
        press.value = press.value.filter((p) => p.press_id !== pressId)
      } else {
        throw new Error(data.message || 'Failed to delete press item')
      }
    } catch (err) {
      console.error('Error deleting press item:', err)
      error.value = err.message
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // ==========================================================================
  // RESET
  // ==========================================================================

  function reset() {
    tools.value = []
    announcements.value = []
    matrixImages.value = []
    featuredProjects.value = []
    press.value = []
    publishedProjects.value = []
    isLoading.value = false
    isSaving.value = false
    error.value = null
  }

  return {
    // State
    tools,
    announcements,
    matrixImages,
    featuredProjects,
    press,
    publishedProjects,
    isLoading,
    isSaving,
    error,

    // Getters
    activeAnnouncements,
    featuredProjectCount,

    // Actions
    fetchAllContent,
    createTool,
    updateTool,
    deleteTool,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    createMatrixImage,
    deleteMatrixImage,
    addFeaturedProject,
    removeFeaturedProject,
    createPress,
    updatePress,
    deletePress,
    reset,
  }
})

