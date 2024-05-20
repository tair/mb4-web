import axios from 'axios'
import { defineStore } from 'pinia'

export const useSpecimenCitationsStore = defineStore({
  id: 'specimen-citations',
  state: () => ({
    isLoaded: false,
    citations: [],
  }),
  getters: {
    citationIds: function () {
      const citationIds = new Set()
      for (const citations of this.citations) {
        if (citations.link_id) {
          citationIds.add(citations.link_id)
        }
      }
      return Array.from(citationIds)
    },
    bibliographyIds: function () {
      const bibliographyIds = new Set()
      for (const citations of this.citations) {
        if (citations.reference_id) {
          bibliographyIds.add(citations.reference_id)
        }
      }
      return Array.from(bibliographyIds)
    },
  },
  actions: {
    async fetchCitations(projectId, specimenId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/citations`
      const response = await axios.get(url)
      this.citations = response.data.citations

      this.isLoaded = true
    },
    async create(projectId, specimenId, citation) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/citations/create`
      const response = await axios.post(url, { citation })
      if (response.status == 200) {
        const citation = response.data.citation
        this.citations.push(citation)
        return true
      }
      return false
    },
    async edit(projectId, specimenId, citationId, citation) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/citations/${citationId}/edit`
      const response = await axios.post(url, { citation })
      if (response.status == 200) {
        const citation = response.data.citation
        this.removeCitationsByIds([citation.link_id])
        this.citations.push(citation)
        return true
      }
      return false
    },
    async deleteIds(projectId, specimenId, citationIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/citations/delete`
      const response = await axios.post(url, {
        citation_ids: citationIds,
      })
      if (response.status == 200) {
        this.removeCitationsByIds(citationIds)
        return true
      }
      return false
    },
    getCitationById(citationId) {
      for (const citation of this.citations) {
        if (citation.link_id == citationId) {
          return citation
        }
      }
      return null
    },
    getCitationsByIds(citationIds) {
      const map = new Map()
      for (const citation of this.citations) {
        if (citationIds.includes(citation.link_id)) {
          map.set(citation.link_id, citation)
        }
      }
      return map
    },
    removeCitationsByIds(citationIds) {
      let x = 0
      while (x < this.citations.length) {
        if (citationIds.includes(this.citations[x].link_id)) {
          this.citations.splice(x, 1)
        } else {
          ++x
        }
      }
    },
    invalidate() {
      this.citations = []
      this.isLoaded = false
    },
  },
})
