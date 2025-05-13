import axios from 'axios'
import { defineStore } from 'pinia'

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
    },
  }),
  getters: {},
  actions: {
    async fetchResults(query) {
      const baseUrl = import.meta.env.VITE_API_URL
      this.searching.projects = true
      this.searching.media = true
      this.searching.media_views = true
      this.searching.specimens = true
      this.searching.characters = true
      this.searching.references = true
      this.searching.matrices = true
      this.searching.taxa = true
      // Clear previous results
      this.results.projects = []
      this.results.media = []
      this.results.media_views = []
      this.results.specimens = []
      this.results.characters = []
      this.results.references = []
      this.results.matrices = []
      this.results.taxa = []

      // Fetch projects
      axios
        .get(`${baseUrl}/search/projects`, { params: query })
        .then((res) => {
          console.log(res.data)
          this.results.projects = res.data.projects
        })
        .catch(() => {
          this.results.projects = []
        })
        .finally(() => {
          this.searching.projects = false
        })

      // Fetch media
      axios
        .get(`${baseUrl}/search/media`, { params: query })
        .then((res) => {
          this.results.media = res.data.media
          console.log(this.results.media)
        })
        .catch(() => {
          this.results.media = []
        })
        .finally(() => {
          this.searching.media = false
        })

      // Fetch media-views
      axios
        .get(`${baseUrl}/search/media-views`, { params: query })
        .then((res) => {
          this.results.media_views = res.data.mediaViews
        })
        .catch(() => {
          this.results.media_views = []
        })
        .finally(() => {
          this.searching.media_views = false
        })

      // Fetch specimens
      axios
        .get(`${baseUrl}/search/specimens`, { params: query })
        .then((res) => {
          this.results.specimens = res.data.specimens
        })
        .catch(() => {
          this.results.specimens = []
        })
        .finally(() => {
          this.searching.specimens = false
        })

      // Fetch characters
      axios
        .get(`${baseUrl}/search/characters`, { params: query })
        .then((res) => {
          console.log(res.data)
          this.results.characters = res.data.characters
        })
        .catch(() => {
          this.results.characters = []
        })
        .finally(() => {
          this.searching.characters = false
        })

      // Fetch references
      axios
        .get(`${baseUrl}/search/references`, { params: query })
        .then((res) => {
          this.results.references = res.data.references
        })
        .catch(() => {
          this.results.references = []
        })
        .finally(() => {
          this.searching.references = false
        })

      // Fetch matrices
      axios
        .get(`${baseUrl}/search/matrices`, { params: query })
        .then((res) => {
          this.results.matrices = res.data.matrices
        })
        .catch(() => {
          this.results.matrices = []
        })
        .finally(() => {
          this.searching.matrices = false
        })

      // Fetch taxa
      axios
        .get(`${baseUrl}/search/taxa`, { params: query })
        .then((res) => {
          this.results.taxa = res.data.taxa
        })
        .catch(() => {
          this.results.taxa = []
        })
        .finally(() => {
          this.searching.taxa = false
        })
    },
  },
})
