import axios from 'axios'
import { defineStore } from 'pinia'

/**
 * Defines a store for the users in the project. This is useful for retrieving
 * user information once but then populating the name whenever the user id is
 * available.
 */
export const useProjectMemberGroupsStore = defineStore({
  id: 'project-member-groups',
  state: () => ({
    isLoaded: false,
    groups: [],
  }),
  actions: {
    async fetchGroups(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/groups`
      const response = await axios.get(url)
      this.groups = response.data.groups
      this.isLoaded = true
    },
    getGroupById(groupId) {
      for (const group of this.groups) {
        if (group.group_id == groupId) {
          return group
        }
      }
      return null
    },
    async deleteGroup(projectId, groupId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/groups/delete`
      const response = await axios.post(url, {
        group_id: groupId,
      })
      if (response.status == 200) {
        this.removeGroupById(groupId)
        return true
      }
      return false
    },
    removeGroupById(groupId) {
      for (let x = 0; x < this.groups.length; ++x) {
        if (groupId == this.groups[x].group_id) {
          this.groups.splice(x, 1)
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