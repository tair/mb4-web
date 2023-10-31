import axios from 'axios'
import { defineStore } from 'pinia'

export const useTaxaStore = defineStore({
  id: 'taxa',
  state: () => ({
    isLoaded: false,
    taxa: [],
    partitions: [],
    matrices: [],
  }),
  getters: {
  },
  actions: {
    async fetchTaxaByProjectId(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/taxa`
      const response = await axios.get(url)
      this.taxa = response.data.taxa

      await this.fetchTaxaUsageByProjectId(projectId)
      this.isLoaded = true
    },
    async fetchTaxaUsageByProjectId(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/taxa/usages`
      const response = await axios.get(url)
      this.partitions = response.data.partitions
      this.matrices = response.data.matrices
    }
  },
})
