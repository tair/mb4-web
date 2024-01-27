import axios from 'axios'
import { defineStore } from 'pinia'

export const useFolioMediaStore = defineStore({
  id: 'folio-media',
  state: () => ({
    isLoaded: false,
    media: [],
  }),
  getters: {
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
      this.media = response.data.media

      this.isLoaded = true
    },
    async create(projectId, folioId, mediaIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/folios/${folioId}/media/create`
      const response = await axios.post(url, { media_ids: mediaIds })
      if (response.status == 200) {
        const media = response.data.media
        this.media.push(...media)
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
        const linkIds = media.map((m) => m.link_id)
        this.removeByIds(linkIds)
        this.media.push(...media)
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
    removeByIds(linkIds) {
      let x = 0
      while (x < this.media.length) {
        if (linkIds.includes(this.media[x].link_id)) {
          this.media.splice(x, 1)
        } else {
          ++x
        }
      }
    },
    invalidate() {
      this.media = []
      this.isLoaded = false
    },
  },
})
