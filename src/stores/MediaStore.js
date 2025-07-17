import axios from 'axios'
import { defineStore } from 'pinia'

export const useMediaStore = defineStore({
  id: 'media',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    media: function () {
      return Array.from(this.map.values())
    },
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
      const media = response.data.media
      this.addMedia(media)

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
        this.addMedia([media])
        return true
      }
      return false
    },
    async createBatch(projectId, mediaFormData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/create/batch`
      try {
        const response = await axios.post(url, mediaFormData)
        if (response.status == 200) {
          const media = response.data.media
          this.addMedia(media)
          return true
        }
        return false
      } catch (error) {
        console.error('Error in createBatch:', error)
        // Re-throw the error so the calling component can handle it
        throw error
      }
    },
    async edit(projectId, mediaId, mediaFormData) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/${mediaId}/edit`
      const response = await axios.post(url, mediaFormData)
      if (response.status == 200) {
        const media = response.data.media
        this.addMedia([media])
        return true
      }
      return false
    },
    async editIds(projectId, mediaIds, json) {
      console.log('MediaStore.editIds called with:', { projectId, mediaIds, json })
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/media/edit`
      console.log('Making request to:', url)
      console.log('Request payload:', { media_ids: mediaIds, media: json })
      
      try {
        const response = await axios.post(url, {
          media_ids: mediaIds,
          media: json,
        })
        console.log('Response status:', response.status)
        console.log('Response data:', response.data)
        
        if (response.status == 200) {
          const media = response.data.media
          console.log('Updating media in store:', media)
          this.addMedia(media)
          return true
        }
        return false
      } catch (error) {
        console.error('Error in editIds:', error)
        console.error('Error response:', error.response?.data)
        return false
      }
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
    addMedia(media) {
      console.log('addMedia called with:', media)
      for (const medium of media) {
        const id = medium.media_id
        console.log(`Updating media ${id} in store:`, medium)
        this.map.set(id, medium)
      }
      console.log('MediaStore map size after update:', this.map.size)
    },
    getMediaById(mediaId) {
      return this.map.get(mediaId)
    },
    getMediaByIds(mediaIds) {
      const map = new Map()
      for (const mediaId of mediaIds) {
        if (this.map.has(mediaId)) {
          map.set(mediaId, this.map.get(mediaId))
        }
      }
      return map
    },
    removeByMediaIds(mediaIds) {
      for (const mediaId of mediaIds) {
        this.map.delete(mediaId)
      }
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
