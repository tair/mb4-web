import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useTaxaStore = defineStore({
  id: 'taxa',
  state: () => ({
    isLoaded: false,
    map: new Map(),
    partitions: [],
    matrices: [],
  }),
  getters: {
    taxa: function () {
      return Array.from(this.map.values())
    },
  },
  actions: {
    async fetch(projectId) {
      const response = await apiService.get(`/projects/${projectId}/taxa`)
      const responseData = await response.json()
        const taxa = responseData.taxa
      this.addTaxa(taxa)

      this.partitions = responseData.partitions
      this.matrices = responseData.matrices

      this.isLoaded = true
    },
    async fetchTaxaUsage(projectId, taxonIds) {
      const response = await apiService.post(`/projects/${projectId}/taxa/usages`, {
        taxon_ids: taxonIds,
      })
      const responseData = await response.json(); return responseData.usages
    },
    async create(projectId, taxon) {
      const response = await apiService.post(`/projects/${projectId}/taxa/create`, taxon)
      if (response.ok) {
        const responseData = await response.json()
        const taxon = responseData.taxon
        this.addTaxa([taxon])
        return true
      }
      return false
    },
    async createBatch(projectId, taxa) {
      const response = await apiService.post(`/projects/${projectId}/taxa/create/batch`, { taxa: taxa })
      if (response.ok) {
        const responseData = await response.json()
        const taxa = responseData.taxa
        this.addTaxa(taxa)
        return true
      }
      return false
    },
    async edit(projectId, taxonId, taxon) {
      const response = await apiService.post(`/projects/${projectId}/taxa/${taxonId}/edit`, taxon)
      if (response.ok) {
        const responseData = await response.json()
        const updatedTaxon = responseData.taxon
        this.addTaxa([updatedTaxon])
        return true
      }
      return false
    },
    async editIds(projectId, taxaIds, json) {
      const response = await apiService.post(`/projects/${projectId}/taxa/edit`, {
        taxa_ids: taxaIds,
        taxa: json,
      })
      if (response.ok) {
        const responseData = await response.json()
        const taxa = responseData.taxa
        this.addTaxa(taxa)
        return true
      }
      return false
    },
    async deleteIds(projectId, taxonIds, remappedTaxonIds) {
      const response = await apiService.post(`/projects/${projectId}/taxa/delete`, {
        taxon_ids: taxonIds,
        remapped_taxon_ids: remappedTaxonIds,
      })
      if (response.ok) {
        this.removeByTaxonIds(taxonIds)
        return true
      }
      return false
    },
    addTaxa(taxa) {
      for (const taxon of taxa) {
        const taxonId = taxon.taxon_id
        this.map.set(taxonId, taxon)
      }
    },
    getTaxonById(taxonId) {
      return this.map.get(taxonId)
    },
    getTaxaByIds(taxonIds) {
      const taxa = []
      for (const taxonId of taxonIds) {
        if (this.map.has(taxonId)) {
          taxa.push(this.map.get(taxonId))
        }
      }
      return taxa
    },
    removeByTaxonIds(taxonIds) {
      for (const taxonId of taxonIds) {
        this.map.delete(taxonId)
      }
    },
    searchTaxa(searchTerm) {
      if (!searchTerm || !searchTerm.trim()) {
        return this.taxa
      }

      const normalizedSearchTerm = searchTerm.toLowerCase().trim()

      // Define searchable fields for taxa
      const searchableFields = [
        'genus',
        'subgenus',
        'specific_epithet',
        'subspecific_epithet',
        'scientific_name_author',
        'scientific_name_year',
        'higher_taxon_family',
        'higher_taxon_order',
        'higher_taxon_class',
        'higher_taxon_phylum',
        'higher_taxon_kingdom',
      ]

      return this.taxa.filter((taxon) => {
        return searchableFields.some((field) => {
          const value = taxon[field]
          return value && String(value).toLowerCase().includes(normalizedSearchTerm)
        })
      })
    },
    invalidate() {
      this.map.clear()
      this.partitions = []
      this.matrices = []

      this.isLoaded = false
    },
  },
})
