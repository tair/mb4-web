import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useMediaViewsStore = defineStore({
  id: 'media-views',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    mediaViews: function () {
      return Array.from(this.map.values())
    },
  },
  actions: {
    async fetchMediaViews(projectId) {
      const response = await apiService.get(`/projects/${projectId}/views`)
      const responseData = await response.json()
        const mediaViews = responseData.views || []
      this.addMediaViews(mediaViews)

      this.isLoaded = true
    },
    async create(projectId, data) {
      try {
        const response = await apiService.post(`/projects/${projectId}/views/create`, data)
        if (response.ok) {
          // Handle both single view and bulk creation responses
          if (responseData.view) {
            this.addMediaViews([responseData.view])
          } else if (responseData.views) {
            this.addMediaViews(responseData.views)
          }
          return { success: true }
        }
        return { success: false }
      } catch (error) {
        console.error('Error creating media views:', error)
        if (error.response?.data?.status === 'error') {
          const errorData = error.response.data
          let errorMessage = errorData.message

          if (errorData.existingNames) {
            errorMessage += `: ${errorData.existingNames.join(', ')}`
          }

          return {
            success: false,
            error: errorMessage,
          }
        }
        return {
          success: false,
          error: 'Failed to create media views. Please try again.',
        }
      }
    },
    async edit(projectId, viewId, view) {
      const response = await apiService.post(`/projects/${projectId}/views/${viewId}/edit`, view)
      if (response.ok) {
        const responseData = await response.json()
        const view = responseData.view
        this.addMediaViews([view])
        return true
      }
      return false
    },
    async deleteIds(projectId, viewIds) {
      const response = await apiService.post(`/projects/${projectId}/views/delete`, {
        view_ids: viewIds,
      })
      if (response.ok) {
        this.removeByViewIds(viewIds)
        return true
      }
      return false
    },
    addMediaViews(mediaViews) {
      for (const mediaView of mediaViews) {
        const id = mediaView.view_id
        this.map.set(id, mediaView)
      }
    },
    getMediaViewById(viewId) {
      return this.map.get(viewId)
    },
    getMediaViewByIds(viewIds) {
      const views = []
      for (const viewId of viewIds) {
        if (this.map.has(viewId)) {
          views.push(this.map.get(viewId))
        }
      }
      return views
    },
    removeByViewIds(viewIds) {
      for (const viewId of viewIds) {
        this.map.delete(viewId)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
