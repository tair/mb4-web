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
    async editUser(projectId, linkId, membership_type, group_ids) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/users/${linkId}/edit`
      const response = await axios.post(url, {
        membership_type,
        group_ids,
      })
      if (response.status == 200) {
        this.updateUser(
          linkId,
          response.data.group_ids,
          response.data.membership_type
        )
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
        this.users.push(user)
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
        this.users.push(user)
        return true
      }
      return false
    },
    updateUser(linkId, group_ids, membership_type) {
      const index = this.getUserIndexByLinkId(linkId)
      this.users[index].group_ids = group_ids
      this.users[index].membership_type = membership_type
    },
    isUserInProject(email) {
      const user = this.users.find((user) => user.email == email)
      return !!user
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
    addUsers(users) {
      for (const user of users) {
        const id = user.user_id
        this.map.set(id, user)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
