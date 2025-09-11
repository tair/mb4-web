import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

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
      const response = await apiService.get(`/projects/${projectId}/folios/${folioId}/media`)
      const responseData = await response.json()
        const media = responseData.media
      this.addMedia(media)

      this.isLoaded = true
    },
    async create(projectId, folioId, mediaIds) {
      const response = await apiService.post(`/projects/${projectId}/folios/${folioId}/media/create`, { media_ids: mediaIds })
      if (response.ok) {
        const responseData = await response.json()
        const media = responseData.media
        this.addMedia(media)
        return true
      }
      return false
    },
    async edit(projectId, folioId, mediaId, media) {
      const response = await apiService.post(`/projects/${projectId}/folios/${folioId}/media/${mediaId}/edit`, { media })
      if (response.ok) {
        const responseData = await response.json()
        const media = responseData.media
        this.addMedia([media])
        return true
      }
      return false
    },
    async deleteIds(projectId, folioId, linkIds) {
      const response = await apiService.post(`/projects/${projectId}/folios/${folioId}/media/delete`, {
        link_ids: linkIds,
      })
      if (response.ok) {
        this.removeByIds(linkIds)
        return true
      }
      return false
    },
    async reorderMedia(projectId, folioId, linkIds, index) {
      try {
        const response = await apiService.post(`/projects/${projectId}/folios/${folioId}/media/reorder`, {
          link_ids: linkIds,
          index: index,
        })

        if (response.ok) {
          await this.fetch(projectId, folioId)
          return true
        }
        return false
      } catch (error) {
        console.error('Reorder API error:', error)
        throw error
      }
    },
    async find(projectId, folioId, text) {
      const response = await apiService.post(`/projects/${projectId}/folios/${folioId}/media/search`, { text })
      if (response.ok) {
        const responseData = await response.json(); return responseData.media_ids
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
