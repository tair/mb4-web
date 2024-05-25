import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectDuplicationStore = defineStore({
  id: 'project-duplication-request',
  state: () => ({
    isLoaded: false,
    isPublished: false,
    onetimeMedia: [],
    userAccess: false,
  }),

  actions: {
    async sendRequest(projectId, remarks, transfer) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/duplication/request`
      await axios.post(url, { remarks, transfer })
    },
    async checkForConditions(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/duplication/request`
      const response = await axios.get(url)
      console.log('first')

      this.onetimeMedia = response.data.oneTimeMedia
      this.isPublished = response.data.projectPublished
      this.userAccess = response.data.hasAccess
      this.isLoaded = true
    },
  },
})
