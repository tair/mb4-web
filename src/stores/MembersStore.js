import axios from 'axios'
import { defineStore } from 'pinia'

export const useMembersStore = defineStore({
    id:"members",
    state: () => ({
        isLoaded: false,
        members: []
    }),
    getters: {},
    actions: {
        async fetchMembers(projectId) {
            const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/members`
            const response = await axios.get(url)
            this.members = response.data.members
            this.isLoaded = true
          },
          async create(projectId, member) {
            const url = `${
              import.meta.env.VITE_API_URL
            }/projects/${projectId}/members/find`
            const response = await axios.post(url, member)
            if (response.status == 200) {
              const member = response.data.member
              this.members.push(member)
              return true
            }
            return false
          },
          async edit(projectId, memberId, member) {
            const url = `${
              import.meta.env.VITE_API_URL
            }/projects/${projectId}/members/${memberId}/edit`
            const response = await axios.post(url, member)
            if (response.status == 200) {
              const member = response.data.member
              this.removeByMemberIds([member.member_id])
              this.members.push(member)
              return true
            }
            return false
          },
          async deleteIds(projectId, memberIds) {
            const url = `${
              import.meta.env.VITE_API_URL
            }/projects/${projectId}/members/delete`
            const response = await axios.post(url, {
              member_ids: memberIds,
            })
            if (response.status == 200) {
              this.removeByMemberIds(memberIds)
              return true
            }
            return false
          },
          invalidate() {
            this.members = []
            this.isLoaded = false
          }
    }
})