import axios from 'axios'
import { defineStore } from 'pinia'
import { useTaxaStore } from '@/stores/TaxaStore'

export const useSpecimensStore = defineStore({
  id: 'specimens',
  state: () => ({
    isLoaded: false,
    specimens: [],
  }),
  getters: {
    taxaIds: function () {
      const taxaIds = new Set()
      for (const specimen of this.specimens) {
        if (specimen.taxon_id) {
          taxaIds.add(specimen.taxon_id)
        }
      }
      return Array.from(taxaIds)
    },
  },
  actions: {
    async fetchSpecimens(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens`
      const response = await axios.get(url)
      this.specimens = response.data.specimens

      this.isLoaded = true
    },
    async fetchSpecimensUsage(projectId, specimenIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/usages`
      const response = await axios.post(url, {
        specimen_ids: specimenIds,
      })
      return response.data.usages
    },
    async create(projectId, specimen) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/create`
      const response = await axios.post(url, { specimen })
      if (response.status == 200) {
        const specimen = response.data.specimen
        this.specimens.push(specimen)
        return true
      }
      return false
    },
    async createBatch(projectId, specimens, taxa) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/create/batch`
      const response = await axios.post(url, { specimens, taxa })
      if (response.status == 200) {
        const taxaStore = useTaxaStore()
        // Add newly create taxa to the taxa store.
        const taxa = response.data.taxa
        taxaStore.taxa.push(...taxa)

        const specimens = response.data.specimens
        this.specimens.push(...specimens)
        return true
      }
      return false
    },
    async edit(projectId, specimenId, specimen) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/${specimenId}/edit`
      const response = await axios.post(url, { specimen })
      if (response.status == 200) {
        const specimen = response.data.specimen
        this.removeBySpecimenIds([specimen.specimen_id])
        this.specimens.push(specimen)
        return true
      }
      return false
    },
    async deleteIds(projectId, specimenIds, remappedSpecimenIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/specimens/delete`
      const response = await axios.post(url, {
        specimen_ids: specimenIds,
        remapped_specimen_ids: remappedSpecimenIds,
      })
      if (response.status == 200) {
        this.removeBySpecimenIds(specimenIds)
        return true
      }
      return false
    },
    getSpecimenById(specimenId) {
      for (const specimen of this.specimens) {
        if (specimen.specimen_id == specimenId) {
          return specimen
        }
      }
      return null
    },
    getSpecimensByIds(specimenIds) {
      const map = new Map()
      for (const specimen of this.specimens) {
        if (specimenIds.includes(specimen.specimen_id)) {
          return specimen
        }
      }
      return map
    },
    removeBySpecimenIds(specimenIds) {
      let x = 0
      while (x < this.specimens.length) {
        if (specimenIds.includes(this.specimens[x].specimen_id)) {
          this.specimens.splice(x, 1)
        } else {
          ++x
        }
      }
    },
    invalidate() {
      this.specimens = []
      this.isLoaded = false
    },
  },
})
