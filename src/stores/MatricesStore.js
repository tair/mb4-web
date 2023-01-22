import axios from 'axios'
import { defineStore } from 'pinia'

export const useMatricesStore = defineStore({
  id: 'matrices',
  state: () => ({
    isLoading: true,
    matrices: null,
    partitions: null,
    canEditMatrix: null,
  }),
  getters: {},
  actions: {
    async fetchMatricesByProjectId(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/matrices`
      const response = await axios.get(url)
      this.matrices = response.data.matrices
      this.partitions = response.data.partitions
      this.canEditMatrix = response.data.canEditMatrix
      this.isLoading = false
    },
  },
})
