import axios from 'axios'
import { defineStore } from 'pinia'

export const useBibliographiesStore = defineStore({
  id: 'documents',
  state: () => ({
    isLoaded: false,
    bibliographies: [],
    filters: [],
  }),
  getters: {
    letters() {
      const letters = new Set()
      for (const bibliography of this.bibliographies) {
        const firstLetter = bibliography.authors[0]
        if (firstLetter) {
          letters.add(firstLetter.toUpperCase())
        }
      }
      return [...letters].sort()
    },
    filtered_bibliographies() {
      return this.filters.reduce(
        (bibliographies, filter) => bibliographies.filter(filter),
        this.bibliographies
      )
    },
  },
  actions: {
    async fetchBibliographies(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography`
      const response = await axios.get(url)
      this.bibliographies = response.data.bibliographies
      this.isLoaded = true
    },

    invalidate() {
      this.bibliographies = []
      this.isLoaded = false
    },
  },
})
