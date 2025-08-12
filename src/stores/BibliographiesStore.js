import axios from 'axios'
import { defineStore } from 'pinia'

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
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography`
      const response = await axios.get(url)
      const bibliographies = response.data.bibliographies || []
      this.addReferences(bibliographies)

      this.isLoaded = true
    },
    async deleteIds(projectId, referenceIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/delete`
      const response = await axios.post(url, {
        reference_ids: [referenceIds],
      })
      if (response.status == 200) {
        this.removeByReferenceIds(referenceIds)
        return true
      }
      return false
    },
    async create(projectId, reference) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/create`
      const response = await axios.post(url, reference)
      if (response.status == 200) {
        const bibliography = response.data.bibliography
        this.addReferences([bibliography])
        return true
      }
      return false
    },
    async edit(projectId, referenceId, reference) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/${referenceId}/edit`
      const response = await axios.post(url, reference)
      if (response.status == 200) {
        const bibliography = response.data.bibliography
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
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/check-citations`
      const response = await axios.post(url, { reference_ids: referenceIds })
      if (response.status === 200) {
        return response.data.citations
      }
      return []
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
    async upload(projectId, formData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/upload`
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.status === 200) {
        // Refresh the bibliography list after successful upload
        await this.fetchBibliographies(projectId)
        return response.data.import_info
      }
      return null
    },
  },
})
