import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useProjectMemberGroupsStore = defineStore({
  id: 'project-member-groups',
  state: () => ({
    isLoaded: false,
    groups: [],
  }),
  actions: {
    async fetchGroups(projectId) {
      const response = await apiService.get(`/projects/${projectId}/groups`)
      const responseData = await response.json()
      this.groups = responseData.groups
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
      const response = await apiService.post(`/projects/${projectId}/groups/delete`, {
        group_id: groupId,
      })
      if (response.ok) {
        this.removeGroupById(groupId)
        return true
      }
      return false
    },
    async editGroup(projectId, groupId, changes) {
      const response = await apiService.post(`/projects/${projectId}/groups/${groupId}/edit`, {
        group_id: groupId,
        group_name: changes.group_name,
        description: changes.description,
      })
      if (response.ok) {
        const responseData = await response.json()
        const group = responseData.group
        this.removeGroupById(group.group_id)
        this.groups.push(group)
        return true
      }
      return false
    },
    async createGroup(projectId, group) {
      const response = await apiService.post(`/projects/${projectId}/groups/create`, { group })
      if (response.ok) {
        const responseData = await response.json()
        const group = responseData.group
        this.groups.push(group)
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
