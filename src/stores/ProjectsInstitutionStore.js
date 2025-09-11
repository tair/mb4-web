import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useProjectInstitutionStore = defineStore({
  id: 'project-institutions',
  state: () => ({
    isLoaded: false,
    institutions: [],
  }),

  actions: {
    async fetchInstitutions(projectId) {
      try {
        const response = await apiService.get(`/projects/${projectId}/institutions`)
        const responseData = await response.json()
        this.institutions = responseData.institutions
        this.isLoaded = true
      } catch (e) {
        console.error('Error fetching the Institutions', e)
        this.isLoaded = false
      }
    },

    async removeInstitution(projectId, institutionIds) {
      const response = await apiService.post(`/projects/${projectId}/institutions/remove`, { institutionIds })
      if (response.ok) {
        const responseData = await response.json()
        this.removeByInstitutionIds(responseData.institutionIds)
        return true
      }
      return false
    },

    removeByInstitutionIds(institutionIds) {
      this.institutions = this.institutions.filter(
        (institution) => !institutionIds.includes(institution.institution_id)
      )
    },

    async addInstitution(projectId, institutionId, name) {
      const response = await apiService.post(`/projects/${projectId}/institutions/add`, { institutionId, name })

      if (response.ok) {
        this.removeByInstitutionIds([institutionId])

        const responseData = await response.json()
        const institution = responseData.institution

        this.institutions.push(institution)

        return true
      }
      return false
    },

    // async editInstitution(
    //   projectId,
    //   institutionId,
    //   name,
    //   selectedInstitutionId
    // ) {
    //   const url = `${
    //     apiService.buildUrl('')
    //   }/projects/${projectId}/institutions/edit`

    //   const response = await apiService.post(`/projects/${projectId}/institutions/edit`, {
    //     institutionId,
    //     name,
    //     selectedInstitutionId,
    //   })

    //   if (response.ok) {
    //     this.removeByInstitutionIds([institutionId])

    //     const responseData = await response.json()
    //     const institution = responseData.institution
    //     this.institutions.push(institution)

    //     return true
    //   }

    //   return false
    // },
  },
})
