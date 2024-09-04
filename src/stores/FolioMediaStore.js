import axios from 'axios'
import { defineStore } from 'pinia'

export const useFolioMediaStore = defineStore({
  id: 'folio-media',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    media: function () {
      return Array.from(this.map.values())
    },
    folioIds: function () {
      const folioIds = new Set()
      for (const media of this.media) {
        if (media.folio_id) {
          folioIds.add(media.folio_id)
        }
      }
      return Array.from(folioIds)
    },
    mediaIds: function () {
      const mediaIds = new Set()
      for (const media of this.media) {
        if (media.media_id) {
          mediaIds.add(media.media_id)
        }
      }
      return Array.from(mediaIds)
    },
  },
  actions: {
    async fetch(projectId, folioId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/media`
      const response = await axios.get(url)
      const media = response.data.media
      this.addMedia(media)

      this.isLoaded = true
    },
    async create(projectId, folioId, mediaIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/media/create`
      const response = await axios.post(url, { media_ids: mediaIds })
      if (response.status == 200) {
        const media = response.data.media
        this.addMedia([media])
        return true
      }
      return false
    },
    async edit(projectId, folioId, mediaId, media) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/media/${mediaId}/edit`
      const response = await axios.post(url, { media })
      if (response.status == 200) {
        const media = response.data.media
        this.addMedia([media])
        return true
      }
      return false
    },
    async deleteIds(projectId, folioId, linkIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/media/delete`
      const response = await axios.post(url, {
        link_ids: linkIds,
      })
      if (response.status == 200) {
        this.removeByIds(linkIds)
        return true
      }
      return false
    },
    async find(projectId, folioId, text) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/media/search`
      const response = await axios.post(url, { text })
      if (response.status == 200) {
        return response.data.media_ids
      }
      return []
    },
    addMedia(links) {
      for (const link of links) {
        const id = link.link_id
        this.map.set(id, link)
      }
    },
    getMediaById(linkId) {
      return this.map.get(linkId)
    },
    getMediaByIds(linkIds) {
      const map = new Map()
      for (const linkId of linkIds) {
        if (this.map.has(linkId)) {
          map.set(linkId, this.map.get(linkId))
        }
      }
      return map
    },
    removeByIds(linkIds) {
      for (const linkId of linkIds) {
        this.map.delete(linkId)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
