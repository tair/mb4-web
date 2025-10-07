import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

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
      const response = await apiService.get(`/projects/${projectId}/matrices`)
      const responseData = await response.json()
      this.matrices = responseData.matrices
      this.partitions = responseData.partitions
      this.canEditMatrix = responseData.canEditMatrix
      this.jobs = responseData.jobs
      this.isLoaded = true
    },
  },
})
