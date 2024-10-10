import axios from 'axios'
import { defineStore } from 'pinia'
import { useTaxaStore } from '@/stores/TaxaStore'

export const useSpecimensStore = defineStore({
  id: 'specimens',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    specimens: function () {
      return Array.from(this.map.values())
    },
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
      const specimens = response.data.specimens || []
      this.addSpecimens(specimens)

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
        this.addSpecimens([specimen])
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
        taxaStore.addTaxa(taxa)

        const specimens = response.data.specimens
        this.addSpecimens(specimens)
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
        this.addSpecimens([specimen])
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
    addSpecimens(specimens) {
      for (const specimen of specimens) {
        const specimenId = specimen.specimen_id
        this.map.set(specimenId, specimen)
      }
    },
    getSpecimenById(specimenId) {
      return this.map.get(specimenId)
    },
    getSpecimensByIds(specimenIds) {
      const specimens = []
      for (const specimenId of specimenIds) {
        if (this.map.has(specimenId)) {
          specimens.push(this.map.get(specimenId))
        }
      }
      return specimens
    },
    removeBySpecimenIds(specimenIds) {
      for (const specimenId of specimenIds) {
        this.map.delete(specimenId)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
