import axios from 'axios'
import { defineStore } from 'pinia'

export const useBibliographiesStore = defineStore({
  id: 'bibliographies',
  state: () => ({
    isLoaded: false,
    bibliographies: [],
  }),
  getters: {},
  actions: {
    async fetchBibliographies(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography`
      const response = await axios.get(url)
      this.bibliographies = response.data.bibliographies
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
        this.bibliographies.push(bibliography)
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
        this.removeByReferenceIds([bibliography.reference_id])
        this.bibliographies.push(bibliography)
        return true
      }
      return false
    },
    async batchEdit(projectId, referenceIds, changes) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/edit`
      const response = await axios.post(url, {
        referenceIds: referenceIds,
        changes: changes,
      })
      if (response.status == 200) {
        const bibliographies = response.data.bibliographies
        this.removeByReferenceIds(referenceIds)
        this.bibliographies.push(...bibliographies)
        return true
      }
      return false
    },
    removeByReferenceIds(referenceIds) {
      let x = 0
      while (x < this.bibliographies.length) {
        if (referenceIds.includes(this.bibliographies[x].reference_id)) {
          this.bibliographies.splice(x, 1)
        } else {
          ++x
        }
      }
    },
    getReferenceById(referenceId) {
      for (let x = 0; x < this.bibliographies.length; ++x) {
        const bibliography = this.bibliographies[x]
        if (bibliography.reference_id == referenceId) {
          return bibliography
        }
      }
      return null
    },
    invalidate() {
      this.bibliographies = []
      this.isLoaded = false
    },
  },
})
