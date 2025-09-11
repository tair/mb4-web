import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useSearchResultsStore = defineStore({
  id: 'searchResults',
  state: () => ({
    results: {
      projects: [],
      media: [],
      media_views: [],
      specimens: [],
      characters: [],
      references: [],
      matrices: [],
      taxa: [],
      members: [],
    },
    searching: {
      projects: false,
      media: false,
      media_views: false,
      specimens: false,
      characters: false,
      references: false,
      matrices: false,
      taxa: false,
      members: false,
    },
  }),
  getters: {},
  actions: {
    async fetchResults(query) {
      this.searching.projects = true
      this.searching.media = true
      this.searching.media_views = true
      this.searching.specimens = true
      this.searching.characters = true
      this.searching.references = true
      this.searching.matrices = true
      this.searching.taxa = true
      this.searching.members = true
      // Clear previous results
      this.results.projects = []
      this.results.media = []
      this.results.media_views = []
      this.results.specimens = []
      this.results.characters = []
      this.results.references = []
      this.results.matrices = []
      this.results.taxa = []
      this.results.members = []

      // Fetch all results in parallel
      const searchPromises = [
        // Fetch projects
        apiService.get('/search/projects', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.projects = data.projects
          })
          .catch(() => {
            this.results.projects = []
          })
          .finally(() => {
            this.searching.projects = false
          }),

        // Fetch media
        apiService.get('/search/media', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.media = data.media
          })
          .catch(() => {
            this.results.media = []
          })
          .finally(() => {
            this.searching.media = false
          }),

        // Fetch media-views
        apiService.get('/search/media-views', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.media_views = data.mediaViews
          })
          .catch(() => {
            this.results.media_views = []
          })
          .finally(() => {
            this.searching.media_views = false
          }),

        // Fetch specimens
        apiService.get('/search/specimens', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.specimens = data.specimens
          })
          .catch(() => {
            this.results.specimens = []
          })
          .finally(() => {
            this.searching.specimens = false
          }),

        // Fetch characters
        apiService.get('/search/characters', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.characters = data.characters
          })
          .catch(() => {
            this.results.characters = []
          })
          .finally(() => {
            this.searching.characters = false
          }),

        // Fetch references
        apiService.get('/search/references', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.references = data.references
          })
          .catch(() => {
            this.results.references = []
          })
          .finally(() => {
            this.searching.references = false
          }),

        // Fetch matrices
        apiService.get('/search/matrices', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.matrices = data.matrices
          })
          .catch(() => {
            this.results.matrices = []
          })
          .finally(() => {
            this.searching.matrices = false
          }),

        // Fetch taxa
        apiService.get('/search/taxa', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.taxa = data.taxa
          })
          .catch(() => {
            this.results.taxa = []
          })
          .finally(() => {
            this.searching.taxa = false
          }),

        // Fetch members
        apiService.get('/search/members', { params: query })
          .then(async (res) => {
            const data = await res.json()
            this.results.members = data.members
          })
          .catch(() => {
            this.results.members = []
          })
          .finally(() => {
            this.searching.members = false
          })
      ]

      // Wait for all searches to complete
      await Promise.allSettled(searchPromises)
    },
  },
})
