import axios from 'axios'
import { defineStore } from 'pinia'

export const useMediaViewsStore = defineStore({
  id: 'media-views',
  state: () => ({
    isLoaded: false,
    mediaViews: [],
    filters: [],
    selectedLetter: null,
  }),
  getters: {
    letters() {
      const letters = new Set()
      for (const mediaView of this.mediaViews) {
        if (mediaView?.name?.length > 0) {
          const firstLetter = mediaView.name[0]
          letters.add(firstLetter.toUpperCase())
        }
      }
      return [...letters].sort()
    },
    filteredMediaViews() {
      return this.filters
        .reduce(
          (mediaViews, filter) => mediaViews.filter(filter),
          this.mediaViews
        )
        .sort((a, b) => {
          const nameA = a.name
          if (!nameA) {
            return -1
          }

          const nameB = b.name
          if (!nameB) {
            return -1
          }

          const compare = nameA.localeCompare(nameB)
          if (compare) {
            return compare
          }
        })
    },
  },
  actions: {
    async fetchMediaViews(projectId) {
      const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/views`
      const response = await axios.get(url)
      this.mediaViews = response.data.views
      this.isLoaded = true
    },
    getMediaViewById(viewId) {
      debugger
      for (const mediaView of this.mediaViews) {
        if (mediaView.view_id == viewId) {
          return mediaView
        }
      }
      return null
    },
    async create(projectId, view) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/views/create`
      const response = await axios.post(url, view)
      if (response.status == 200) {
        const view = response.data.view
        this.mediaViews.push(view)
        return true
      }
      return false
    },
    async edit(projectId, viewId, view) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/views/${viewId}/edit`
      const response = await axios.post(url, view)
      if (response.status == 200) {
        const view = response.data.view
        this.removeByViewIds([view.view_id])
        this.mediaViews.push(view)
        return true
      }
      return false
    },
    async deleteIds(projectId, viewIds) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/views/delete`
      const response = await axios.post(url, {
        view_ids: viewIds,
      })
      if (response.status == 200) {
        this.removeByViewIds(viewIds)
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
      this.filters = [
        (mediaView) => {
          if (mediaView?.name.length > 0) {
            const name = mediaView?.name[0]
            return name.toUpperCase() == letter
          }
          return false
        },
      ]
    },
    removeByViewIds(viewIds) {
      let x = 0
      while (x < this.mediaViews.length) {
        if (viewIds.includes(this.mediaViews[x].view_id)) {
          this.mediaViews.splice(x, 1)
        } else {
          ++x
        }
      }
    },
    invalidate() {
      this.mediaViews = []
      this.isLoaded = false
    },
  },
})
