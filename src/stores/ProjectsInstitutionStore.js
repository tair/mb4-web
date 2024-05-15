import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectInstitutionStore = defineStore({
  id: 'project-institutions',
  state: () => ({
    isLoaded: false,
    institutions: [],
    institutionList: [],
  }),

  actions: {
    async fetchInstitutions(projectId) {
      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/institutions`

        const response = await axios.get(url)
        this.institutions = response.data.institutions
        this.isLoaded = true
      } catch (e) {
        console.error('Error fetching the Institutions', e)
        this.isLoaded = false
      }
    },

    async removeInstitution(projectId, institutionIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/institutions/remove`

      const response = await axios.post(url, { institutionIds })

      if (response.status == 200) {
        this.removeByInstitutionIds(response.data.institutionIds)

        return true
      }

      return false
    },

    async removeByInstitutionIds(institutionIds) {
      for (let x = 0; x < institutionIds.length; x++) {
        const spliceIndex = this.institutions.indexOf(institutionIds[x])

        this.institutions.splice(spliceIndex, 1)
      }
    },

    async assignInstitution(projectId, institutionToAdd) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/institutions/create`

      const response = await axios.post(url, { institutionToAdd })

      if (response.status == 200) {
        const institutionToAdd = response.data.institution

        this.institutions.push({
          institutionId: institutionToAdd.institution_id,
          name: institutionToAdd.name,
        })

        return institutionToAdd
      }

      return false
    },

    async seachInstitutionsBySegment(projectId, Seg) {
      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/institutions/search`
        const response = await axios.get(url, {
          params: { searchTerm: Seg.value },
        })

        this.institutionList = response.data
      } catch (e) {
        console.error('Error getting Institutions')
        return false
      }
    },
  },
})
