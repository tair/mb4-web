import axios from 'axios'
import { defineStore } from 'pinia'

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
      const cacheAge = this.lastFetched ? Date.now() - this.lastFetched : Infinity
      const isStale = cacheAge > 30000 // 30 seconds
      
      if (!force && this.isLoaded && !isStale) {
        return // Use cached data
      }

      const url = `${import.meta.env.VITE_API_URL}/projects/`
      const response = await axios.get(url)
      this.projects = response.data.projects
      this.lastFetched = Date.now()
      this.isLoaded = true
    },
    async create(project) {
      const url = `${import.meta.env.VITE_API_URL}/projects/create`
      const response = await axios.post(url, { project })
      if (response.status == 200) {
        const project = response.data.project
        this.projects.push(project)
        return project
      }
      return false
    },
    async edit(projectId, project) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/edit`
      const response = await axios.post(url, { project })
      if (response.status == 200) {
        const project = response.data.project
        this.removeProjectById(project.project_id)
        this.projects.push(project)
        return true
      }
      return false
    },
    async delete(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/delete`
      const response = await axios.post(url)
      if (response.status == 200) {
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
    async createProject(projectData) {
      try {
        // Log the data being sent
        // if (projectData instanceof FormData) {
        //   const formDataObj = {}
        //   for (const [key, value] of projectData.entries()) {
        //     formDataObj[key] = value
        //   }
        //   console.log("Sending FormData to API:", formDataObj)
        // } else {
        //   console.log("Sending data to API:", projectData)
        // }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/projects/create`,
          projectData,
          {
            headers:
              projectData instanceof FormData
                ? {
                    'Content-Type': 'multipart/form-data',
                  }
                : {
                    'Content-Type': 'application/json',
                  },
          }
        )

        // Add the new project to the store's cache so it appears in the dashboard
        if (response.data && response.status === 201) {
          // For newly created projects, we need to fetch fresh project data
          // since the user needs to see it with proper administrator info
          await this.fetchProjects()
        }

        return response.data
      } catch (error) {
        console.error('Error creating project:', error.response || error)
        throw error
      }
    },
  },
})
