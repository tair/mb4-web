import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const usePublicProjectsStore = defineStore({
  id: 'publicProjects',
  state: () => ({
    loading: false,
    projects: null,
    err: null,

    /// browse data ////
    titles: null,
    authors: '',
    journals: '',
    institutions: '',
    stats: null,
    ///////////////

    // pagination info //
    projectList: null,
    currentPage: 1,
    itemsPerPage: 25,
    totalPages: 0,
    /////////////////////

    // morphobank statistics //
    morphoBankStats: null,
    morphoBankStatsLoading: false,
    ////////////////////////////
  }),
  getters: {
    isLoading(state) {
      return state.loading
    },
  },
  actions: {
    fetchByPage() {
      const start = (this.currentPage - 1) * this.itemsPerPage

      const end = start + this.itemsPerPage
      this.projectList = this.projects.slice(start, end)
    },

    recalculatePageInfo() {
      // calculate initial page sizes
      this.totalPages = Math.floor(this.projects.length / this.itemsPerPage)
      if (this.totalPages * this.itemsPerPage < this.projects.length) {
        this.totalPages++
      }
    },

    async sortProjectsByPublishedDate(sort_by) {
      // load projects if not exists
      if (!this.projects) await this.fetchProjects()

      this.projects.sort((a, b) => {
        if (a.published_on < b.published_on) return sort_by == 'asc' ? -1 : 1
        if (a.published_on > b.published_on) return sort_by != 'asc' ? -1 : 1
        return 0
      })

      this.recalculatePageInfo()
      this.fetchByPage(1)

      return this.projects
    },

    async sortProjectsByNumber(sort_by) {
      // load projects if not exists
      if (!this.projects) await this.fetchProjects()

      this.projects.sort((a, b) => {
        if (a.project_id < b.project_id) return sort_by == 'asc' ? -1 : 1
        if (a.project_id > b.project_id) return sort_by != 'asc' ? -1 : 1
        return 0
      })

      this.recalculatePageInfo()
      this.fetchByPage(1)

      return this.projects
    },

    async sortProjectsByJournalYear(sort_by) {
      // load projects if not exists
      if (!this.projects) await this.fetchProjects()

      this.projects.sort((a, b) => {
        if (a.journal_year < b.journal_year) return sort_by == 'asc' ? -1 : 1
        if (a.journal_year > b.journal_year) return sort_by != 'asc' ? -1 : 1
        return 0
      })

      this.recalculatePageInfo()
      this.fetchByPage(1)

      return this.projects
    },

    async fetchProjectStats() {
      // if already loaded, return them.
      if (this.stats) return this.stats

      this.loading = true
      this.err = null

      try {
        const res = await apiService.get('/public/projects/stats')
        const data = await res.json()
        this.stats = data
      } catch (e) {
        console.error(`store:projects:fetchProjectStats(): ${e}`)
        this.err = 'Error fetching project stats.'
      } finally {
        this.loading = false
      }
    },

    async fetchProjects() {
      // if already loaded, return them.
      if (this.projects) return this.projects

      this.loading = true
      this.err = null

      try {
        const res = await apiService.get('/s3/projects.json')
        const data = await res.json()
        this.projects = data
        this.recalculatePageInfo()
        this.fetchByPage(1)
      } catch (e) {
        console.error(`store:projects:fetchProjects(): ${e}`)
        this.err = 'Error fetching project list.'
      } finally {
        this.loading = false
      }
    },

    async fetchProjectTitles(sort_by) {
      // if already loaded, return them.
      if (this.titles) {
        this.titles.sort((a, b) => {
          const A = a.name.trim().toUpperCase() // ignore upper and lowercase
          const B = b.name.trim().toUpperCase() // ignore upper and lowercase
          if (A < B) return sort_by == 'asc' ? -1 : 1
          if (A > B) return sort_by != 'asc' ? -1 : 1
          return 0
        })

        return this.titles
      }

      this.loading = true
      this.err = null

      try {
        const res = await apiService.get('/public/projects/titles')
        const data = await res.json()
        this.titles = data
      } catch (e) {
        console.error(`store:projects:fetchProjectTitles()`)
        this.err = 'Error fetching project titles.'
      } finally {
        this.loading = false
      }
    },

    async fetchProjectAuthor() {
      // if already loaded, return them.
      if (this.authors) return this.authors

      this.loading = true
      this.err = null

      try {
        const res = await apiService.get('/public/projects/authors_projects')
        const data = await res.json()
        this.authors = data
      } catch (e) {
        console.error(`store:projects:fetchProjectAuthor()`)
        this.err = 'Error fetching project authors.'
      } finally {
        this.loading = false
      }
    },

    async fetchProjectJournal() {
      // if already loaded, return them.
      if (this.journals) return this.journals

      this.loading = true
      this.err = null

      try {
        const res = await apiService.get('/public/projects/journals_projects')
        const data = await res.json()
        this.journals = data
      } catch (e) {
        console.error(`store:projects:fetchProjectJournal()`)
        this.err = 'Error fetching project journals.'
      } finally {
        this.loading = false
      }
    },

    async fetchProjectInstitutions(sort_field, order) {
      // if already loaded, return them.
      if (this.institutions) {
        this.institutions.sort((a, b) => {
          let A, B
          if (sort_field == 'name') {
            A = a.name.trim().toUpperCase()
            B = b.name.trim().toUpperCase()
          } else {
            A = a.count
            B = b.count
          }

          if (A < B) return order == 'asc' ? -1 : 1
          if (A > B) return order != 'asc' ? -1 : 1
          return 0
        })

        return this.institutions
      }

      this.loading = true
      this.err = null

      try {
        const res = await apiService.get('/public/projects/institutions')
        const data = await res.json()
        this.institutions = data
      } catch (e) {
        console.error(`store:projects:fetchProjectInsitutions()`)
        this.err = 'Error fetching project institutions.'
      } finally {
        this.loading = false
      }
    },

    async fetchMorphoBankStats() {
      // if already loaded, return them.
      if (this.morphoBankStats) return this.morphoBankStats

      this.morphoBankStatsLoading = true

      try {
        const res = await apiService.get('/stats/home')
        const data = await res.json()
        this.morphoBankStats = data

        return this.morphoBankStats
      } catch (e) {
        console.error(`store:projects:fetchMorphoBankStats(): ${e}`)
        this.err = 'Error fetching MorphoBank statistics.'
      } finally {
        this.morphoBankStatsLoading = false
      }
    },
  },
})
