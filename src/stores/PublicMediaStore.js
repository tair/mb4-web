import axios from 'axios'
import { defineStore } from 'pinia'

export const usePublicMediaStore = defineStore({
  id: 'publicMedia',
  state: () => ({
    loading: false,
    project_id: null,
    media_files: null,
    err: null,

    // pagination info //
    mediaList: null,
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
      this.mediaList = this.media_files.slice(start, end)
    },

    recalculatePageInfo() {
      // calculate initial page sizes
      this.totalPages = Math.floor(this.media_files.length / this.itemsPerPage)
      if (this.totalPages * this.itemsPerPage < this.media_files.length) {
        this.totalPages++
      }
    },

    async fetchMediaFiles(project_id) {
      // if already loaded, return them.
      if (this.project_id && this.project_id == project_id) return

      this.loading = true
      this.err = null

      try {
        var getter = axios.create();
        delete getter.defaults.headers.common['Authorization'];

        const url = `https://mb4-data.s3.us-west-2.amazonaws.com/media_files/prj_${project_id}.json`
        const res = await getter.get(url)
        this.media_files = res.data
        this.project_id = project_id
        this.recalculatePageInfo()
        this.fetchByPage(1)
      } catch (e) {
        console.error(`store:mediaFiles:fetchProjects(): ${e}`)
        this.err = 'Error fetching project list.'
      } finally {
        this.loading = false
      }
    },
  },
})
