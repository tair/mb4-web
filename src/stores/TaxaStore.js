import axios from 'axios'
import { defineStore } from 'pinia'
import { csvToArray } from '@/utils/csv'

export const useTaxaStore = defineStore({
  id: 'taxa',
  state: () => ({
    isLoaded: false,
    taxa: [],
    partitions: [],
    matrices: [],
  }),
  getters: {},
  actions: {
    invalidate() {
      this.isLoaded = false
      this.taxa = []
      this.partitions = []
      this.matrices = []
    },
    async fetch(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/taxa`
      const response = await axios.get(url)
      this.taxa = response.data.taxa
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
        this.taxa.push(taxon)
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
        this.taxa.push(...taxa)
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
        const taxon = response.data.taxon
        this.removeByTaxonIds([taxon.taxon_id])
        this.taxa.push(taxon)
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
        this.removeByTaxonIds(taxaIds)
        this.taxa.push(...taxa)
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
    getTaxonById(taxonId) {
      for (const taxon of this.taxa) {
        if (taxon.taxon_id == taxonId) {
          return taxon
        }
      }
      return null
    },
    getTaxaByIds(taxaIds) {
      const map = new Map()
      for (const taxon of this.taxa) {
        if (taxaIds.includes(taxon.taxon_id)) {
          map.set(taxon.taxon_id, taxon)
        }
      }
      return map
    },
    removeByTaxonIds(taxonIds) {
      let x = 0
      while (x < this.taxa.length) {
        if (taxonIds.includes(this.taxa[x].taxon_id)) {
          this.taxa.splice(x, 1)
        } else {
          ++x
        }
      }
    },
  },
})
