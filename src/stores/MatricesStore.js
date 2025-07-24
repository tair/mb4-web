import axios from 'axios'
import { defineStore } from 'pinia'

export const useMatricesStore = defineStore({
  id: 'matrices',
  state: () => ({
    isLoaded: false,
    matrices: null,
    partitions: null,
    canEditMatrix: null,
    jobs: null,
  }),
  getters: {},
  actions: {
    invalidate() {
      this.isLoaded = false
      this.matrices = null
      this.partitions = null
      this.canEditMatrix = null
      this.jobs = null
    },

    async fetchMatricesByProjectId(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/matrices`
      const response = await axios.get(url)
      this.matrices = response.data.matrices
      this.partitions = response.data.partitions
      this.canEditMatrix = response.data.canEditMatrix
      this.jobs = response.data.jobs
      this.isLoaded = true
    },
  },
})
