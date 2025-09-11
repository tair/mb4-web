import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

/**
 * ProjectOverviewStore
 * 
 * Fetches comprehensive project overview data for unpublished projects.
 * Expected API response structure from `/projects/${id}/overview`:
 * 
 * {
 *   "overview": {
 *     "project_id": number,
 *     "published": number,
 *     "created_on": number,
 *     "disk_usage": number,
 *     "disk_usage_limit": number,
 *     "description": string,
 *     "article_doi": string,
 *     "project_doi": string,
 *     "journal_url": string,
 *     "nsf_funded": number,
 *     "partitioned_from": number | null,
 *     "last_published_partition": string | null,
 *     "exemplar_media_id": number | null,
 *     "image_props": {
 *       "specimen_name": string,
 *       "view_name": string,
 *       "media": object
 *     },
 *     "stats": {
 *       "timestamp": string,
 *       "media": number,
 *       "matrices": number,
 *       "docs": number,
 *       "folios": number,
 *       "taxa": number,
 *       "specimens": number,
 *       "characters": number,
 *       "media_size": number,
 *       "matrix_cells_scored": number,
 *       "matrix_cell_media": number,
 *       "matrix_cell_media_labels": number,
 *       "character_characters": number,
 *       "character_media_characters": number,
 *       "character_unordered": number,
 *       "character_media_characters_labels": number,
 *       "character_states": number,
 *       "character_state_media": number,
 *       "character_state_media_labels": number
 *     },
 *     "institutions": array,
 *     "recentChanges": array,
 *     "members": array,
 *     "taxa": array
 *   }
 * }
 */

export const useProjectOverviewStore = defineStore({
  id: 'projectOverview',
  state: () => ({
    isLoaded: false,
    isLoading: false,
    overview: null,
    currentProjectId: null,
  }),
  actions: {
    async fetchProject(id) {
      // If we're switching to a different project, reset the state
      if (this.currentProjectId && this.currentProjectId !== id) {
        this.isLoaded = false
        this.isLoading = false
        this.overview = null
        this.currentProjectId = null
      }

      // Prevent duplicate requests for the same project
      if (this.isLoading || (this.isLoaded && this.currentProjectId === id)) {
        return
      }

      const url = `/projects/${id}/overview`
      this.isLoading = true
      this.currentProjectId = id

      try {
        const response = await apiService.get(url)
        const responseData = await response.json()
        this.overview = responseData.overview
        this.isLoaded = true
      } catch (e) {
        console.error('Error fetching project overview:', e)
        this.isLoaded = false
        this.currentProjectId = null
      } finally {
        this.isLoading = false
      }
    },
    invalidate() {
      this.isLoaded = false
      this.isLoading = false
      this.overview = null
      // Keep currentProjectId so we can re-fetch if needed
    },
    async refreshDiskUsage(id) {
      // Refresh only the disk usage data without invalidating the entire overview
      if (!this.overview) {
        // If no overview is loaded, fetch the full project data
        return this.fetchProject(id)
      }

      try {
        const url = `/projects/${id}/overview`
        const response = await apiService.get(url)
        const responseData = await response.json()
        
        // Update only the disk usage fields
        if (responseData.overview) {
          this.overview.disk_usage = responseData.overview.disk_usage
          this.overview.disk_usage_limit = responseData.overview.disk_usage_limit
          // Also update stats if they exist
          if (responseData.overview.stats) {
            this.overview.stats = responseData.overview.stats
          }
        }
      } catch (e) {
        console.error('Error refreshing disk usage:', e)
        // If refresh fails, fall back to full fetch
        return this.fetchProject(id)
      }
    },
  },
})
