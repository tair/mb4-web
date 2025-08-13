import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectOverviewStore = defineStore({
  id: 'projectOverview',
  state: () => ({
    isLoaded: false,
    isLoading: false,
    overview: null,
    currentProjectId: null,
  }),
  actions: {
    async fetchProject(id) {
      // If we're switching to a different project, reset the state
      if (this.currentProjectId && this.currentProjectId !== id) {
        this.isLoaded = false
        this.isLoading = false
        this.overview = null
        this.currentProjectId = null
      }

      // Prevent duplicate requests for the same project
      if (this.isLoading || (this.isLoaded && this.currentProjectId === id)) {
        return
      }

      const url = `${import.meta.env.VITE_API_URL}/projects/${id}/overview`
      this.isLoading = true
      this.currentProjectId = id

      try {
        const response = await axios.get(url)
        this.overview = response.data.overview
        this.isLoaded = true
      } catch (e) {
        console.error('Error fetching project overview:', e)
        this.isLoaded = false
        this.currentProjectId = null
      } finally {
        this.isLoading = false
      }
    },
    invalidate() {
      this.isLoaded = false
      this.isLoading = false
      this.overview = null
      // Keep currentProjectId so we can re-fetch if needed
    },
  },
})
