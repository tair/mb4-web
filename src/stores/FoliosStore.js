import axios from 'axios'
import { defineStore } from 'pinia'

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
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/folios`
      const response = await axios.get(url)
      const folios = response.data.folios
      this.addFolios(folios)

      this.isLoaded = true
    },
    async create(projectId, folio) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/create`
      const response = await axios.post(url, { folio })
      if (response.status == 200) {
        const folio = response.data.folio
        this.addFolios([folio])
        return true
      }
      return false
    },
    async edit(projectId, folioId, folio) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/edit`
      const response = await axios.post(url, { folio })
      if (response.status == 200) {
        const folio = response.data.folio
        this.addFolios([folio])
        return true
      }
      return false
    },
    async deleteIds(projectId, folioIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/delete`
      const response = await axios.post(url, {
        folio_ids: folioIds,
      })
      if (response.status == 200) {
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
