import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useProjectsStore = defineStore({
  id: 'projects',
  state: () => ({
    isLoaded: false,
    projects: [],
    lastFetched: null, // Timestamp of last fetch
  }),
  getters: {},
  actions: {
    async fetchProjects(force = false) {
      // Smart caching: only fetch if data is stale (older than 30 seconds) or forced
      const cacheAge = this.lastFetched
        ? Date.now() - this.lastFetched
        : Infinity
      const isStale = cacheAge > 30000 // 30 seconds

      if (!force && this.isLoaded && !isStale) {
        return // Use cached data
      }

      const response = await apiService.get('/projects/')
      const responseData = await response.json()
      this.projects = responseData.projects
      this.lastFetched = Date.now()
      this.isLoaded = true
    },
    async create(project) {
      const response = await apiService.post('/projects/create', { project })
      if (response.ok) {
        const responseData = await response.json()
        const newProject = responseData.project
        this.projects.push(newProject)
        return newProject
      }
      return false
    },
    async edit(projectId, project) {
      const response = await apiService.post(`/projects/${projectId}/edit`, { project })
      if (response.ok) {
        const responseData = await response.json()
        const updatedProject = responseData.project
        this.removeProjectById(updatedProject.project_id)
        this.projects.push(updatedProject)
        return true
      }
      return false
    },
    async delete(projectId) {
      const response = await apiService.post(`/projects/${projectId}/delete`)
      if (response.ok) {
        this.removeProjectById(projectId)
        return true
      }
      return false
    },
    getProjectById(projectId) {
      for (const project of this.projects) {
        if (project.project_id == projectId) {
          return project
        }
      }
      return null
    },
    removeProjectById(projectId) {
      for (let x = 0; x < this.projects.length; ++x) {
        const project = this.projects[x]
        if (project.project_id == projectId) {
          this.projects.splice(x, 1)
          break
        }
      }
    },
    async createProject(
      projectData,
      journalCoverFile = null,
      exemplarMediaFile = null
    ) {
      try {
        let requestData
        let headers = {}

        if (journalCoverFile || exemplarMediaFile) {
          // Use FormData for file upload
          const formData = new FormData()

          // Add all project data as JSON string
          formData.append('projectData', JSON.stringify(projectData))

          // Add journal cover file if provided
          if (journalCoverFile) {
            formData.append('journal_cover', journalCoverFile)
          }

          // Add exemplar media file if provided
          if (exemplarMediaFile) {
            formData.append('exemplar_media', exemplarMediaFile)
          }

          requestData = formData
          // Don't set Content-Type header - let browser set it with boundary
        } else {
          // Use JSON for project data only
          requestData = projectData
          headers = {
            'Content-Type': 'application/json',
          }
        }

        const response = await apiService.post('/projects/create', requestData, { headers })

        // Add the new project to the store's cache so it appears in the dashboard
        if (response.data && response.status === 201) {
          // For newly created projects, we need to fetch fresh project data
          // since the user needs to see it with proper administrator info
          await this.fetchProjects()
        }

        const responseData = await response.json(); return responseData
      } catch (error) {
        console.error('Error creating project:', error.response || error)
        throw error
      }
    },
    async setExemplarMedia(projectId, mediaId) {
      try {
        const response = await apiService.post(`/projects/${projectId}/edit`, { 
          exemplar_media_id: mediaId 
        })
        
        if (response.ok) {
          // Update the project in our store if we have it
          const project = this.getProjectById(projectId)
          if (project) {
            project.exemplar_media_id = mediaId
          }
          
          // Invalidate project overview cache so it refreshes with new exemplar
          const { useProjectOverviewStore } = await import('@/stores/ProjectOverviewStore')
          const projectOverviewStore = useProjectOverviewStore()
          projectOverviewStore.invalidate()
          
          // Also trigger a fresh fetch if the overview was for this project
          if (projectOverviewStore.currentProjectId === projectId) {
            await projectOverviewStore.fetchProject(projectId)
          }
          
          return true
        }
        return false
      } catch (error) {
        console.error('Error setting exemplar media:', error.response?.data || error)
        throw error
      }
    },
  },
})
