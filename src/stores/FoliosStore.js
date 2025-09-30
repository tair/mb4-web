import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useFoliosStore = defineStore({
  id: 'folios',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    folios: function () {
      return Array.from(this.map.values())
    },
  },
  actions: {
    async fetch(projectId) {
      const response = await apiService.get(`/projects/${projectId}/folios`)
      const responseData = await response.json()
        const folios = responseData.folios
      this.addFolios(folios)

      this.isLoaded = true
    },
    async create(projectId, folio) {
      const response = await apiService.post(`/projects/${projectId}/folios/create`, { folio })
      if (response.ok) {
        const responseData = await response.json()
        const folio = responseData.folio
        this.addFolios([folio])
        return true
      }
      return false
    },
    async edit(projectId, folioId, folio) {
      const response = await apiService.post(`/projects/${projectId}/folios/${folioId}/edit`, { folio })
      if (response.ok) {
        const responseData = await response.json()
        const folio = responseData.folio
        this.addFolios([folio])
        return true
      }
      return false
    },
    async deleteIds(projectId, folioIds) {
      const response = await apiService.post(`/projects/${projectId}/folios/delete`, {
        folio_ids: folioIds,
      })
      if (response.ok) {
        this.removeByFolioIds(folioIds)
        return true
      }
      return false
    },
    addFolios(folios) {
      for (const folio of folios) {
        const id = folio.folio_id
        this.map.set(id, folio)
      }
    },
    getFolioById(folioId) {
      return this.map.get(folioId)
    },
    getFolioByIds(folioIds) {
      const map = new Map()
      for (const folioId of folioIds) {
        if (this.map.has(folioId)) {
          map.set(folioId, this.map.get(folioId))
        }
      }
      return map
    },
    removeByFolioIds(folioIds) {
      for (const folioId of folioIds) {
        this.map.delete(folioId)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
