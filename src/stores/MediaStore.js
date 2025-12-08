import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

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
      const url = `/projects/${projectId}/media`
      const response = await apiService.get(url)
      const responseData = await response.json()
      const media = responseData.media
      this.addMedia(media)

      this.isLoaded = true
    },
    async fetchMediaUsage(projectId, mediaIds) {
      const url = `/projects/${projectId}/media/usages`
      const response = await apiService.post(url, {
        media_ids: mediaIds,
      })
      const responseData = await response.json()
      return responseData.usages
    },
    async create(projectId, mediaFormData) {
      const url = `/projects/${projectId}/media/create`
      const response = await apiService.post(url, mediaFormData)
      if (response.ok) {
        const responseData = await response.json()
        const media = responseData.media
        this.addMedia([media])
        return media // Return the created media object instead of just true
      }
      return false
    },
    async createBatch(projectId, mediaFormData) {
      const url = `/projects/${projectId}/media/create/batch`
      try {
        const response = await apiService.post(url, mediaFormData)
        if (response.ok) {
          const responseData = await response.json()
          const media = responseData.media
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
    async create3D(projectId, mediaFormData) {
      try {
        const response = await apiService.post(`/projects/${projectId}/media/create/3d`, mediaFormData)
        if (response.ok) {
          const responseData = await response.json()
          const media = responseData.media
          this.addMedia([media])
          return true
        }
        return false
      } catch (error) {
        console.error('Error in create3D:', error)
        // Re-throw the error so the calling component can handle it
        throw error
      }
    },
    async createVideo(projectId, mediaFormData) {
      try {
        const response = await apiService.post(`/projects/${projectId}/media/create/video`, mediaFormData)
        if (response.ok) {
          const responseData = await response.json()
          const media = responseData.media
          this.addMedia([media])
          return true
        }
        return false
      } catch (error) {
        console.error('Error in createVideo:', error)
        // Re-throw the error so the calling component can handle it
        throw error
      }
    },
    async createStacks(projectId, mediaFormData) {
      try {
        const response = await apiService.post(`/projects/${projectId}/media/create/stacks`, mediaFormData)
        if (response.ok) {
          const responseData = await response.json()
          const media = responseData.media
          this.addMedia([media]) // Stack creates a single media file containing the ZIP
          return true
        }
        return false
      } catch (error) {
        console.error('Error in createStacks:', error)
        // Re-throw the error so the calling component can handle it
        throw error
      }
    },
    /**
     * Initiate a direct-to-S3 upload for large CT scan files.
     * This bypasses CloudFront/httpd proxy timeouts.
     * 
     * @param {string} projectId - The project ID
     * @param {Object} metadata - Upload metadata (filename, filesize, specimen_id, view_id, etc.)
     * @returns {Promise<{mediaId: number, uploadUrl: string, s3Key: string, expiresIn: number}>}
     */
    async initiateStacksUpload(projectId, metadata) {
      try {
        const response = await apiService.post(`/projects/${projectId}/media/stacks/initiate`, metadata)
        if (response.ok) {
          const responseData = await response.json()
          return responseData
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to initiate upload')
      } catch (error) {
        console.error('Error in initiateStacksUpload:', error)
        throw error
      }
    },
    /**
     * Complete a direct-to-S3 upload after the file has been uploaded.
     * Optionally accepts a thumbnail image extracted from the ZIP in the browser,
     * which avoids having the backend download the entire ZIP for thumbnail generation.
     * 
     * @param {string} projectId - The project ID
     * @param {number} mediaId - The media ID from initiateStacksUpload
     * @param {Object|null} thumbnailData - Optional thumbnail extracted from ZIP {blob, filename, mimetype}
     * @returns {Promise<Object>} The created media object
     */
    async completeStacksUpload(projectId, mediaId, thumbnailData = null) {
      try {
        let response
        
        if (thumbnailData && thumbnailData.blob) {
          // Send the thumbnail as multipart form data
          const formData = new FormData()
          formData.append('thumbnail', thumbnailData.blob, thumbnailData.filename)
          response = await apiService.post(`/projects/${projectId}/media/stacks/${mediaId}/complete`, formData)
        } else {
          // No thumbnail - backend will try to extract from S3 (fallback)
          response = await apiService.post(`/projects/${projectId}/media/stacks/${mediaId}/complete`)
        }
        
        if (response.ok) {
          const responseData = await response.json()
          const media = responseData.media
          this.addMedia([media])
          return media
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to complete upload')
      } catch (error) {
        console.error('Error in completeStacksUpload:', error)
        throw error
      }
    },
    async edit(projectId, mediaId, mediaFormData) {
      const response = await apiService.post(`/projects/${projectId}/media/${mediaId}/edit`, mediaFormData, {
        timeout: 300000, // 5 minutes timeout for large media file uploads
      })
      if (response.ok) {
        const responseData = await response.json()
        const media = responseData.media
        this.addMedia([media])
        return true
      }
      return false
    },
    async editIds(projectId, mediaIds, json) {
      try {
        const response = await apiService.post(`/projects/${projectId}/media/edit`, {
          media_ids: mediaIds,
          media: json,
        })

        if (response.ok) {
          const responseData = await response.json()
          const media = responseData.media
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
      const response = await apiService.post(`/projects/${projectId}/media/delete`, {
        media_ids: mediaIds,
        remapped_media_ids: remappedMediaIds,
      })
      if (response.ok) {
        this.removeByMediaIds(mediaIds)
        return true
      }
      return false
    },
    addMedia(media) {
      for (const medium of media) {
        const id = medium.media_id
        this.map.set(id, medium)
      }
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
