import axios from 'axios'
import { defineStore } from 'pinia'

export const useSearchResultsStore = defineStore({
  id: 'searchResults',
  state: () => ({
    isLoaded: false,
    results: [],
  }),
  getters: {},
  actions: {
    async fetchResults(query) {
      this.isLoaded = true
      const url = `${import.meta.env.VITE_API_URL}/search/projects`
      const response = await axios.get(url, { params: query })
      console.log(response.data)
      this.results = response.data
      this.isLoaded = false
    },
  },
})
