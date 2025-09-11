import { defineStore } from 'pinia'
import { useTaxaStore } from '@/stores/TaxaStore'
import { apiService } from '@/services/apiService.js'

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
    identifiedSpecimens: function () {
      return Array.from(this.map.values()).filter(
        (specimen) => specimen.taxon_id
      )
    },
    unidentifiedSpecimens: function () {
      return Array.from(this.map.values()).filter(
        (specimen) => !specimen.taxon_id
      )
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
      const response = await apiService.get(`/projects/${projectId}/specimens`)
      const responseData = await response.json()
        const specimens = responseData.specimens || []
      this.addSpecimens(specimens)
      this.isLoaded = true
    },
    async fetchSpecimensUsage(projectId, specimenIds) {
      const response = await apiService.post(`/projects/${projectId}/specimens/usages`, {
        specimen_ids: specimenIds,
      })
      const responseData = await response.json(); return responseData.usages
    },
    async create(projectId, specimen) {
      const response = await apiService.post(`/projects/${projectId}/specimens/create`, { specimen })
      if (response.ok) {
        const responseData = await response.json()
        const specimen = responseData.specimen
        this.addSpecimens([specimen])
        return true
      }
      return false
    },
    async createBatch(projectId, specimens, taxa) {
      const response = await apiService.post(`/projects/${projectId}/specimens/create/batch`, { specimens, taxa })
      if (response.ok) {
        const taxaStore = useTaxaStore()
        // Add newly create taxa to the taxa store.
        const responseData = await response.json()
        const taxa = responseData.taxa
        const specimens = responseData.specimens
        taxaStore.addTaxa(taxa)
        this.addSpecimens(specimens)
        return true
      }
      return false
    },
    async edit(projectId, specimenId, specimen) {
      const response = await apiService.post(`/projects/${projectId}/specimens/${specimenId}/edit`, { specimen })
      if (response.ok) {
        const responseData = await response.json()
        const specimen = responseData.specimen
        this.addSpecimens([specimen])
        return true
      }
      return false
    },
    async editIds(projectId, specimenIds, json) {
      const response = await apiService.post(`/projects/${projectId}/specimens/edit`, {
        specimen_ids: specimenIds,
        specimen: json,
      })
      if (response.ok) {
        const responseData = await response.json()
        const specimens = responseData.specimens
        this.addSpecimens(specimens)
        return true
      }
      return false
    },
    async deleteIds(projectId, specimenIds, remappedSpecimenIds) {
      const response = await apiService.post(`/projects/${projectId}/specimens/delete`, {
        specimen_ids: specimenIds,
        remapped_specimen_ids: remappedSpecimenIds,
      })
      if (response.ok) {
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
