import axios from 'axios'
import { defineStore } from 'pinia'

export const useMembersStore = defineStore({
  id: 'members',
  state: () => ({
    isLoaded: false,
    members: [],
  }),
  getters: {},
  actions: {
    async fetchMembers(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/members`
      const response = await axios.get(url)
      this.members = response.data.members
      this.isLoaded = true
    },
    invalidate() {
      this.members = []
      this.isLoaded = false
    },
  },
})