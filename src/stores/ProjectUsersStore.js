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
    map: new Map(),
  }),
  getters: {
    users: function () {
      return Array.from(this.map.values())
    },
  },
  actions: {
    async fetchUsers(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/users`
      const response = await axios.get(url)
      const users = response.data.users || []
      this.addUsers(users)

      this.isLoaded = true
    },
    addUsers(users) {
      for (const user of users) {
        const id = user.user_id
        this.map.set(id, user)
      }
    },
    getUserById(userId) {
      return this.map.get(userId)
    },
    getUserByIds(userIds) {
      const users = []
      for (const userId of userIds) {
        if (this.map.has(userId)) {
          users.push(this.map.get(userId))
        }
      }
      return users
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
