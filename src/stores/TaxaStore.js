import axios from 'axios'
import { defineStore } from 'pinia'

export const useTaxaStore = defineStore({
  id: 'taxa',
  state: () => ({
    isLoaded: false,
    taxa: null,
  }),
  getters: {},
  actions: {
    async fetchTaxaByProjectId(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/taxa`
      const response = await axios.get(url)
      this.taxa = response.data.taxa
      this.isLoaded = true
    },
  },
})
