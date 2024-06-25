import axios from 'axios'
import { defineStore } from 'pinia'

/**
 * Defines a store for the users in the project. This is useful for retrieving
 * user information once but then populating the name whenever the user id is
 * available.
 */
export const useProjectUsersStore = defineStore({
  id: 'project-users',
  state: () => ({
    isLoaded: false,
    users: [],
  }),
  actions: {
    async fetchUsers(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/users`
      const response = await axios.get(url)
      this.users = response.data.users
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
    getUserByIds(userIds) {
      const users = []
      for (const user of this.users) {
        if (userIds.has(user.user_id)) {
          users.push(user)
        }
      }
      return users
    },
    async deleteUser(projectId, linkId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/delete`
      const response = await axios.post(url, {
        link_id: linkId,
      })
      if (response.status == 200) {
        this.removeUserById(linkId)
        return true
      }
      return false
    },
    removeUserById(linkId) {
      for (let x = 0; x < this.users.length; ++x) {
        if (linkId == this.users[x].link_id) {
          this.users.splice(x, 1)
          break
        }
      }
    },
    invalidate() {
      this.isLoaded = false
      this.users = []
    },
  },
})
