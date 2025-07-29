import axios from 'axios'
import { defineStore } from 'pinia'

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
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/taxa`
      const response = await axios.get(url)
      const taxa = response.data.taxa
      this.addTaxa(taxa)

      this.partitions = response.data.partitions
      this.matrices = response.data.matrices

      this.isLoaded = true
    },
    async fetchTaxaUsage(projectId, taxonIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/taxa/usages`
      const response = await axios.post(url, {
        taxon_ids: taxonIds,
      })
      return response.data.usages
    },
    async create(projectId, taxon) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/taxa/create`
      const response = await axios.post(url, taxon)
      if (response.status == 200) {
        const taxon = response.data.taxon
        this.addTaxa([taxon])
        return true
      }
      return false
    },
    async createBatch(projectId, taxa) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/taxa//create/batch`
      const response = await axios.post(url, { taxa: taxa })
      if (response.status == 200) {
        const taxa = response.data.taxa
        this.addTaxa(taxa)
        return true
      }
      return false
    },
    async edit(projectId, taxonId, taxon) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/taxa/${taxonId}/edit`
      const response = await axios.post(url, taxon)
      if (response.status == 200) {
        const updatedTaxon = response.data.taxon
        this.addTaxa([updatedTaxon])
        return true
      }
      return false
    },
    async editIds(projectId, taxaIds, json) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/taxa/edit`
      const response = await axios.post(url, {
        taxa_ids: taxaIds,
        taxa: json,
      })
      if (response.status == 200) {
        const taxa = response.data.taxa
        this.addTaxa(taxa)
        return true
      }
      return false
    },
    async deleteIds(projectId, taxonIds, remappedTaxonIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/taxa/delete`
      const response = await axios.post(url, {
        taxon_ids: taxonIds,
        remapped_taxon_ids: remappedTaxonIds,
      })
      if (response.status == 200) {
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
          return value && value.toLowerCase().includes(normalizedSearchTerm)
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
