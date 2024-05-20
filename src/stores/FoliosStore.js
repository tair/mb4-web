import axios from 'axios'
import { defineStore } from 'pinia'

export const useFoliosStore = defineStore({
  id: 'folios',
  state: () => ({
    isLoaded: false,
    folios: [],
  }),
  getters: {},
  actions: {
    async fetch(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/folios`
      const response = await axios.get(url)
      this.folios = response.data.folios
      this.isLoaded = true
    },
    async create(projectId, folio) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/create`
      const response = await axios.post(url, { folio })
      if (response.status == 200) {
        const folio = response.data.folio
        this.folios.push(folio)
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
        this.removeByFolioIds([folio.folio_id])
        this.folios.push(folio)
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
    getFolioById(folioId) {
      for (const folio of this.folios) {
        if (folio.folio_id == folioId) {
          return folio
        }
      }
      return null
    },
    removeByFolioIds(folioIds) {
      let x = 0
      while (x < this.folios.length) {
        if (folioIds.includes(this.folios[x].folio_id)) {
          this.folios.splice(x, 1)
        } else {
          ++x
        }
      }
    },
    invalidate() {
      this.folios = []
      this.isLoaded = false
    },
  },
})
