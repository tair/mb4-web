import axios from 'axios'
import { defineStore } from 'pinia'

/**
 * Defines a store for the users in the project. This is useful for retrieving
 * user information once but then populating the name whenever the user id is
 * available.
 */
export const useProjectUsersStore = defineStore({
  id: 'members',
  state: () => ({
    isLoaded: false,
    users: [],
    members: [],
  }),
  actions: {
    async fetchUsers(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/users`
      const response = await axios.get(url)
      this.users = response.data.users

      const ur = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/members`
      const res = await axios.get(ur)
      this.members = res.data.members
      this.isLoaded = true
    },
    getUserById(userId) {
      for (const user of this.users) {
        if (user.user_id == userId) {
          return user
        }
      }
      return null
    },
    async deleteMember(projectId, linkId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/delete`
      const response = await axios.post(url, {
        link_id: linkId,
      })
      if (response.status == 200) {
        this.removeMemberById(linkId)
        return true
      }
      return false
    },
    removeMemberById(linkId) {
      for (let x = 0; x < this.members.length; ++x) {
        if (linkId == this.members[x].link_id) {
          this.members.splice(x, 1)
          break
        }
      }
    },
    invalidate() {
      this.isLoaded = false
      this.users = []
      this.members = []
    },
  },
})
