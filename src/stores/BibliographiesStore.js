import axios from 'axios'
import { defineStore } from 'pinia'

export const useBibliographiesStore = defineStore({
  id: 'bibliographies',
  state: () => ({
    isLoaded: false,
    bibliographies: [],
    filters: [],
    selectedLetter: null,
  }),
  getters: {
    letters() {
      const letters = new Set()
      for (const bibliography of this.bibliographies) {
        if (bibliography.authors && bibliography.authors.length > 0) {
          const author = bibliography.authors[0]
          if (author.surname) {
            const firstLetter = author.surname[0]
            if (firstLetter) {
              letters.add(firstLetter.toUpperCase())
            }
          }
        }
      }
      return [...letters].sort()
    },
    filteredBibliographies() {
      return this.filters.reduce(
        (bibliographies, filter) => bibliographies.filter(filter),
        this.bibliographies
      ).sort((a, b) => {
        if (a.authors && b.authors) {
          const length = Math.min(a.authors.length, b.authors.length)
          for (let x = 0; x < length; ++x) {
            const surnameA = a.authors[x].surname
            if (!surnameA) {
              return -1
            }

            const surnameB = b.authors[x].surname
            if (!surnameB) {
              return -1
            }

            const compare = surnameA.localeCompare(surnameB)
            if (compare) {
              return compare
            }
          }
        }
      })
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
    async deleteIds(projectId, referenceIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/delete`
      const response = await axios.post(url, {
        reference_ids: [referenceIds],
      })
      if (response.status == 200) {
        this.removeByReferenceIds(referenceIds)
        return true
      }
      return false
    },
    clearFilters() {
      this.selectedLetter = null
      this.filters = []
    },
    filterByLetter(letter) {
      this.selectedLetter = letter
      this.filters = [(bibliography) => {
        if (bibliography.authors && bibliography.authors.length > 0) {
          const author = bibliography.authors[0]
          if (author.surname) {
            const firstLetter = author.surname[0]
            return firstLetter == letter
          }
        }
        return false
      }]
    },
    removeByReferenceIds(referenceIds) {
      let x = 0
      while (x < this.bibliographies.length) {
        if (referenceIds.includes(this.bibliographies[x].reference_id)) {
          this.bibliographies.splice(x, 1)
        }
        ++x
      }
    },
    getReferenceById(referenceId) {
      for (let x = 0; x < this.bibliographies.length; ++x) {
        const bibliography = this.bibliographies[x]
        if (bibliography.reference_id == referenceId) {
          return bibliography
        }
      }
      return null
    },
    invalidate() {
      this.bibliographies = []
      this.isLoaded = false
    },
  },
})
