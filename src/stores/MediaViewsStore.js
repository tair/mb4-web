import axios from 'axios'
import { defineStore } from 'pinia'

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
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/views`
      const response = await axios.get(url)
      const mediaViews = response.data.views || []
      this.addMediaViews(mediaViews)

      this.isLoaded = true
    },
    async create(projectId, data) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/projects/${projectId}/views/create`,
          data
        )
        if (response.status === 200) {
          // Handle both single view and bulk creation responses
          if (response.data.view) {
            this.addMediaViews([response.data.view])
          } else if (response.data.views) {
            this.addMediaViews(response.data.views)
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
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/views/${viewId}/edit`
      const response = await axios.post(url, view)
      if (response.status == 200) {
        const view = response.data.view
        this.addMediaViews([view])
        return true
      }
      return false
    },
    async deleteIds(projectId, viewIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/views/delete`
      const response = await axios.post(url, {
        view_ids: viewIds,
      })
      if (response.status == 200) {
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
