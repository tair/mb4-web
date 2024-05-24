import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectInstitutionStore = defineStore({
  id: 'project-institutions',
  state: () => ({
    isLoaded: false,
    institutions: [],
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

    async addInstitution(projectId, name) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/institutions/create`

      const response = await axios.post(url, { name })

      if (response.status == 200) {
        const institution = response.data.institution

        this.institutions.push({
          institution_id: institution.institution_id,
          name: institution.name,
        })

        return true
      }

      return false
    },
  },
})
