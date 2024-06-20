import axios from 'axios'
import { defineStore } from 'pinia'

export const useMediaStore = defineStore({
  id: 'media',
  state: () => ({
    isLoaded: false,
    media: [],
    filterMediaIds: [],
  }),
  getters: {
    viewIds: function () {
      const viewIds = new Set()
      for (const media of this.media) {
        if (media.view_id) {
          viewIds.add(media.view_id)
        }
      }
      return Array.from(viewIds)
    },
    specimenIds: function () {
      const specimenIds = new Set()
      for (const media of this.media) {
        if (media.specimen_id) {
          specimenIds.add(media.specimen_id)
        }
      }
      return Array.from(specimenIds)
    },
  },
  actions: {
    async fetchMedia(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/media`
      const response = await axios.get(url)
      this.media = response.data.media

      this.isLoaded = true
    },
    async fetchMediaUsage(projectId, mediaIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/usages`
      const response = await axios.post(url, {
        media_ids: mediaIds,
      })
      return response.data.usages
    },
    async create(projectId, mediaFormData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/create`
      const response = await axios.post(url, mediaFormData)
      if (response.status == 200) {
        const media = response.data.media
        this.media.push(media)
        return true
      }
      return false
    },
    async createBatch(projectId, mediaFormData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/create/batch`
      const response = await axios.post(url, mediaFormData)
      if (response.status == 200) {
        const media = response.data.media
        this.media.push(...media)
        return true
      }
      return false
    },
    async edit(projectId, mediaId, mediaFormData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/${mediaId}/edit`
      const response = await axios.post(url, mediaFormData)
      if (response.status == 200) {
        const media = response.data.media
        this.removeByMediaIds([media.media_id])
        this.media.push(media)
        return true
      }
      return false
    },
    async editIds(projectId, mediaIds, json) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/edit`
      const response = await axios.post(url, {
        media_ids: mediaIds,
        media: json,
      })
      if (response.status == 200) {
        const media = response.data.media
        this.removeByMediaIds(mediaIds)
        this.media.push(...media)
        return true
      }
      return false
    },
    async deleteIds(projectId, mediaIds, remappedMediaIds = []) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/delete`
      const response = await axios.post(url, {
        media_ids: mediaIds,
        remapped_media_ids: remappedMediaIds,
      })
      if (response.status == 200) {
        this.removeByMediaIds(mediaIds)
        return true
      }
      return false
    },
    getMediaById(mediaId) {
      for (const media of this.media) {
        if (media.media_id == mediaId) {
          return media
        }
      }
      return null
    },
    getMediaByIds(mediaIds) {
      const map = new Map()
      for (const media of this.media) {
        if (mediaIds.includes(media.media_id)) {
          map.set(media.media_id, media)
        }
      }
      return map
    },
    removeByMediaIds(mediaIds) {
      let x = 0
      while (x < this.media.length) {
        if (mediaIds.includes(this.media[x].media_id)) {
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
