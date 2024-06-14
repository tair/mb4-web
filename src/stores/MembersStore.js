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
    async deleteMembers(projectId, linkIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/members/delete`
      const response = await axios.post(url, {
        link_ids: linkIds,
      })
      if (response.status == 200) {
        this.removeMemberById(linkIds)
        return true
      }
      return false
    },
    removeMemberById(linkIds) {
      for (let x = 0; x < this.members.length; ++x) {
        if (linkIds.includes(this.members[x].link_id)) {
          this.members.splice(x, 1)
          break
        }
      }
    },
    invalidate() {
      this.members = []
      this.isLoaded = false
    },
  },
})
