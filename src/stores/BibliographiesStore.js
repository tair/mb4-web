import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useBibliographiesStore = defineStore({
  id: 'bibliographies',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    bibliographies: function () {
      return Array.from(this.map.values())
    },
  },
  actions: {
    async fetchBibliographies(projectId) {
      const response = await apiService.get(`/projects/${projectId}/bibliography`)
      const responseData = await response.json()
        const bibliographies = responseData.bibliographies || []
      this.addReferences(bibliographies)

      this.isLoaded = true
    },
    async deleteIds(projectId, referenceIds) {
      const response = await apiService.post(`/projects/${projectId}/bibliography/delete`, {
        reference_ids: [referenceIds],
      })
      if (response.ok) {
        this.removeByReferenceIds(referenceIds)
        return true
      }
      return false
    },
    async create(projectId, reference) {
      const response = await apiService.post(`/projects/${projectId}/bibliography/create`, reference)
      if (response.ok) {
        const responseData = await response.json()
        const bibliography = responseData.bibliography
        this.addReferences([bibliography])
        return true
      }
      return false
    },
    async edit(projectId, referenceId, reference) {
      const response = await apiService.post(`/projects/${projectId}/bibliography/${referenceId}/edit`, reference)
      if (response.ok) {
        const responseData = await response.json()
        const bibliography = responseData.bibliography
        this.addReferences([bibliography])
        return true
      }
      return false
    },
    addReferences(bibliographies) {
      for (const bibliography of bibliographies) {
        const referenceId = bibliography.reference_id
        this.map.set(referenceId, bibliography)
      }
    },
    getReferenceById(referenceId) {
      if (this.map.has(referenceId)) {
        return this.map.get(referenceId)
      }
      return null
    },
    getReferencesByIds(referenceIds) {
      const map = new Map()
      for (const referenceId of referenceIds) {
        if (this.map.has(referenceId)) {
          const bibliography = this.map.get(referenceId)
          map.set(referenceId, bibliography)
        }
      }
      return map
    },
    removeByReferenceIds(referenceIds) {
      for (const referenceId of referenceIds) {
        this.map.delete(referenceId)
      }
    },
    async checkCitations(projectId, referenceIds) {
      const response = await apiService.post(`/projects/${projectId}/bibliography/check-citations`, { reference_ids: referenceIds })
      if (response.ok) {
        const responseData = await response.json(); return responseData.citations
      }
      return []
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
    async upload(projectId, formData) {
      const response = await apiService.post(`/projects/${projectId}/bibliography/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.ok) {
        // Refresh the bibliography list after successful upload
        await this.fetchBibliographies(projectId)
        const responseData = await response.json(); return responseData.import_info
      }
      return null
    },
  },
})
