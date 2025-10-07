import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useTaxaCitationsStore = defineStore({
  id: 'taxa-citations',
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
    async fetchCitations(projectId, taxonId) {
      const response = await apiService.get(`/projects/${projectId}/taxa/${taxonId}/citations`)
      const responseData = await response.json()
        const citations = responseData.citations
      this.addCitations(citations)

      this.isLoaded = true
    },
    async create(projectId, taxonId, citationData) {
      try {
        const response = await apiService.post(`/projects/${projectId}/taxa/${taxonId}/citations/create`, { citation: citationData })
        const responseData = await response.json()
        const newCitation = responseData.citation
        this.addCitations([newCitation])
        return true
      } catch (error) {
        throw error
      }
    },
    async edit(projectId, taxonId, citationId, citation) {
      try {
        const response = await apiService.post(`/projects/${projectId}/taxa/${taxonId}/citations/${citationId}/edit`, { citation })
        if (response.ok) {
          const responseData = await response.json()
        const updatedCitation = responseData.citation
          this.removeCitationsByIds([updatedCitation.link_id])
          this.addCitations([updatedCitation])
          return true
        }
        return false
      } catch (error) {
        throw error
      }
    },
    async deleteIds(projectId, taxonId, citationIds) {
      const response = await apiService.post(`/projects/${projectId}/taxa/${taxonId}/citations/delete`, {
        citation_ids: citationIds,
      })
      if (response.ok) {
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
