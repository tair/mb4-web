import axios from 'axios'
import { defineStore } from 'pinia'

export const useMatricesStore = defineStore({
  id: 'matrices',
  state: () => ({
    isLoading: true,
    matrices: null,
  }),
  getters: {},
  actions: {
    async fetchMatricesByProjectId(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/matrices`
      const response = await axios.get(url)
      this.matrices = response.data.matrices
      this.isLoading = false
    },
  },
})
