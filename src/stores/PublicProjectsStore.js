import axios from 'axios'
import { defineStore } from 'pinia'

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
        var getter = axios.create()
        delete getter.defaults.headers.common['Authorization']

        let res = await getter.get(
          `${import.meta.env.VITE_API_URL}/s3/stats_files/projectViewsForLast30Days.json`
        )
        const projectViewsForLast30Days = res.data

        res = await getter.get(
          `${import.meta.env.VITE_API_URL}/s3/stats_files/matrixDownloadsForLast30Days.json`
        )
        const matrixDownloadsForLast30Days = res.data

        res = await getter.get(
          `${import.meta.env.VITE_API_URL}/s3/stats_files/mediaViewsForLast30Days.json`
        )
        const mediaViewsForLast30Days = res.data

        res = await getter.get(
          `${import.meta.env.VITE_API_URL}/s3/stats_files/docDownloadsForLast30Days.json`
        )
        const docDownloadsForLast30Days = res.data

        this.stats = {
          projectViewsForLast30Days,
          matrixDownloadsForLast30Days,
          mediaViewsForLast30Days,
          docDownloadsForLast30Days,
        }
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
        var getter = axios.create()
        delete getter.defaults.headers.common['Authorization']

        const url = `${import.meta.env.VITE_API_URL}/s3/projects.json`
        const res = await getter.get(url)
        this.projects = res.data
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
        const url = `${import.meta.env.VITE_API_URL}/public/projects/titles`
        const res = await axios.get(url)
        this.titles = res.data
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/public/projects/authors_projects`
        const res = await axios.get(url)
        this.authors = res.data
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/public/projects/journals_projects`
        const res = await axios.get(url)
        this.journals = res.data
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/public/projects/institutions`
        const res = await axios.get(url)
        this.institutions = res.data
      } catch (e) {
        console.error(`store:projects:fetchProjectInsitutions()`)
        this.err = 'Error fetching project institutions.'
      } finally {
        this.loading = false
      }
    },
  },
})
