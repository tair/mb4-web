import axios from 'axios'
import { defineStore } from 'pinia'

export const useProjectStore = defineStore({
  id: 'projectDetails',
  state: () => ({
    loading: false,
    err: null,

    // this will NOT be null if we already fetched a project.
    // on all project pages (matrix, taxa, etc), data will be
    // fetched IF only the project_id is null.
    project_id: null,

    overview: null,
    taxa_details: null,
    partitions: null,
    bibliography: null,
    docs: null,
    matrices: null,
    media: null,
    media_views: null,
    specimen_details: null,
  }),
  getters: {
    isLoading(state) {
      return state.loading
    },
  },
  actions: {
    async fetchProject(id) {
      if (this.project_id && this.project_id == id) return

      this.loading = true
      this.err = null

      try {
        const url = `https://mb4-data.s3.us-west-2.amazonaws.com/prj_details/prj_${id}.json`
        const res = await axios.get(url)

        this.overview = res.data.overview
        this.taxa_details = res.data.taxa_details
        this.partitions = res.data.partitions
        this.bibliography = res.data.bibliography
        this.docs = res.data.docs

        this.matrices = res.data.overview.matrices
        this.media_views = res.data.media_views
        this.specimen_details = res.data.specimen_details

        this.project_id = id
      } catch (e) {
        console.error(`store:projectDetails:fetchProject(): ${e}`)
        this.err = 'Error fetching project list.'
      } finally {
        this.loading = false
      }
    },
  },
})
