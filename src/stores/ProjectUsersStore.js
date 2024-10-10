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
    async editUser(projectId, userId, membership_type, group_ids) {
      const user = this.getUserById(userId)
      const linkId = user.link_id
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/${linkId}/edit`

      const response = await axios.post(url, {
        membership_type,
        group_ids,
      })
      if (response.status == 200) {
        user.group_ids = response.data.group_ids
        user.membership_type = response.data.membership_type
        return true
      }
      return false
    },
    async isEmailAvailable(projectId, json) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/isEmailAvailable`
      const response = await axios.post(url, json)
      if (response.status == 200) {
        return response.data
      }
      return false
    },
    async createUser(projectId, json) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/create`
      const response = await axios.post(url, { json })
      if (response.status == 200) {
        const user = response.data.user
        this.addUsers([user])
        return true
      }
      return false
    },
    async addMember(projectId, json) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/add`
      const response = await axios.post(url, { json })
      if (response.status == 200) {
        const user = response.data.user
        this.addUsers([user])
        return true
      }
      return false
    },
    async deleteUser(projectId, userId) {
      const user = this.getUserById(userId)
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/delete`
      const response = await axios.post(url, {
        link_id: user.link_id,
      })
      if (response.status == 200) {
        this.map.delete(userId)
        return true
      }
      return false
    },
    isUserInProject(email) {
      const user = this.users.find((user) => user.email == email)
      return !!user
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
