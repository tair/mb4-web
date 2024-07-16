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
    async editUser(projectId, linkId, user) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/${linkId}/edit`
      const response = await axios.post(url, { user })
      if (response.status == 200) {
        const user = response.data.user
        this.updateUser(linkId, user)
        return true
      }
      return false
    },
    updateUser(linkId, user) {
      const userIndex = this.getUserIndexByLinkId(linkId)
      this.users[userIndex].membership_type = user.membership_type
    },
    getUserIndexByLinkId(linkId) {
      for (let x = 0; x < this.users.length; x++) {
        if (this.users[x].link_id == linkId) {
          return x
        }
      }
      return null
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
    getUserByLinkId(linkId) {
      for (const user of this.users) {
        if (user.link_id == linkId) {
          return user
        }
      }
      return null
    },
    async deleteUser(projectId, linkId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/delete`
      const response = await axios.post(url, {
        link_id: linkId,
      })
      if (response.status == 200) {
        this.removeUserByLinkId(linkId)
        return true
      }
      return false
    },
    removeUserByLinkId(linkId) {
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
