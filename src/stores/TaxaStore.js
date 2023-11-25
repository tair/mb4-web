import axios from 'axios'
import { defineStore } from 'pinia'

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
    async fetchTaxaByProjectId(projectId) {
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
