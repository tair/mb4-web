import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectOverviewStore = defineStore({
  id: 'projectOverview',
  state: () => ({
    isLoaded: false,
    overview: null,
  }),
  actions: {
    async fetchProject(id) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${id}/overview`
      const response = await axios.get(url)
      this.overview = response.data.overview
      this.isLoaded = true
    },
  },
})
