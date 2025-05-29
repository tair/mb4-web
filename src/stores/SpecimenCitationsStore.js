import axios from 'axios'
import { defineStore } from 'pinia'

export const useSpecimenCitationsStore = defineStore({
  id: 'specimen-citations',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    citations: function () {
      return Array.from(this.map.values())
    },
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
      const citations = response.data.citations
      this.addCitations(citations)

      this.isLoaded = true
    },
    async create(projectId, specimenId, citationData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/citations/create`
      try {
        const response = await axios.post(url, { citation: citationData })
        const newCitation = response.data.citation
        this.addCitations([newCitation])
        return true
      } catch (error) {
        throw error
      }
    },
    async edit(projectId, specimenId, citationId, citation) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/citations/${citationId}/edit`
      const response = await axios.post(url, { citation })
      if (response.status == 200) {
        const citation = response.data.citation
        this.addCitations([citation])
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
    addCitations(citations) {
      for (const citation of citations) {
        const id = citation.link_id
        this.map.set(id, citation)
      }
    },
    getCitationById(citationId) {
      return this.map.get(citationId)
    },
    getCitationsByIds(citationIds) {
      const map = new Map()
      for (const citationId of citationIds) {
        if (this.map.has(citationId)) {
          map.set(citationId, this.map.get(citationId))
        }
      }
      return map
    },
    removeCitationsByIds(citationIds) {
      for (const citationId of citationIds) {
        this.map.delete(citationId)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
