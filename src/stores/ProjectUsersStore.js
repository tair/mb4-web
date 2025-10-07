import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

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
      const response = await apiService.get(`/projects/${projectId}/users`)
      const responseData = await response.json()
        const users = responseData.users || []
      this.addUsers(users)

      this.isLoaded = true
    },
    async editUser(projectId, userId, membership_type, group_ids) {
      try {
        const user = this.getUserById(userId)
        const linkId = user.link_id
        const response = await apiService.post(`/projects/${projectId}/users/${linkId}/edit`, {
          membership_type,
          group_ids,
        })
        if (response.ok) {
          const responseData = await response.json()
          user.group_ids = responseData.group_ids
          user.membership_type = responseData.membership_type
          return true
        }
        return false
      } catch (error) {
        console.error('Error editing user:', error)
        return false
      }
    },
    async isEmailAvailable(projectId, json) {
      const response = await apiService.post(`/projects/${projectId}/users/isEmailAvailable`, json)
      if (response.ok) {
        const responseData = await response.json(); return responseData
      }
      return false
    },
    async createUser(projectId, json) {
      const response = await apiService.post(`/projects/${projectId}/users/create`, { json })
      if (response.ok) {
        const responseData = await response.json()
        const user = responseData.user
        this.addUsers([user])
        return true
      }
      return false
    },
    async addMember(projectId, json) {
      const response = await apiService.post(`/projects/${projectId}/users/add`, { json })
      if (response.ok) {
        const responseData = await response.json()
        const user = responseData.user
        this.addUsers([user])
        return true
      }
      return false
    },
    async deleteUser(projectId, userId) {
      const user = this.getUserById(userId)
      const response = await apiService.post(`/projects/${projectId}/users/delete`, {
        link_id: user.link_id,
      })
      if (response.ok) {
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
