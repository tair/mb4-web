import axios from 'axios'
import { defineStore } from 'pinia'
import { searchInObject } from '@/utils/util.js'

export const usePublicMediaStore = defineStore({
  id: 'publicMedia',
  state: () => ({
    loading: false,
    project_id: null,
    full_media_files: null,
    media_files: null,
    err: null,

    // pagination info //
    mediaList: null,
    currentPage: 1,
    itemsPerPage: 25,
    totalPages: 0,
    /////////////////////

    orderByOptions: {
      mnumber: 'MorphoBank number',
      snumber: 'specimen number',
      view: 'view',
      user: 'submitter',
      phylum: 'phylum',
      class: 'class',
      order: 'order',
      superfamily: 'superfamily',
      family: 'family',
      subfamily: 'subfamily',
      genus: 'genus',
      species: 'species',
    },
  }),
  getters: {
    isLoading(state) {
      return state.loading
    },

    getOrderByOptions(state) {
      return state.orderByOptions
    },

    getDefaultOrderBy() {
      return 'mnumber'
    },
    hasMedia() {
      return this.full_media_files?.length > 0
    },
  },
  actions: {
    getMediaFilesByIdList(idList) {
      if (!idList || idList.length == 0) return null
      return this.full_media_files.filter((m) => idList.includes(m.media_id))
    },
    filterMediaFiles(searchStr) {
      if (!searchStr) {
        this.media_files = this.full_media_files
        return
      }
      const mediaIdPattern = /^M(\d+)$/
      let match = searchStr.match(mediaIdPattern)
      if (match) {
        const includeFields = ['media_id']
        searchStr = match[1] // Remove the 'M' and get the digits
        this.media_files = this.full_media_files.filter((item) =>
          searchInObject(item, searchStr, includeFields)
        )
      } else {
        const includeFields = [
          'media_id',
          'view_name',
          'user_name',
          'copyright_holder',
          'taxon_name',
          'higher_taxon_phylum',
          'higher_taxon_class',
          'higher_taxon_order',
          'higher_taxon_superfamily',
          'higher_taxon_family',
          'higher_taxon_subfamily',
          'genus',
          'specific_epithet',
          'specimen_name',
          'notes',
        ]
        this.media_files = this.full_media_files.filter((item) =>
          searchInObject(item, searchStr, includeFields)
        )
      }
    },

    sortByOption(option) {
      switch (option) {
        case 'mnumber':
          this.media_files.sort((a, b) => a.media_id - b.media_id)
          break
        case 'snumber':
          this.media_files.sort((a, b) => {
            // Compare institution_code, considering null values
            if (!a.specimen.institution_code) return 1
            if (!b.specimen.institution_code) return -1
            if (a.specimen.institution_code < b.specimen.institution_code)
              return -1
            if (a.specimen.institution_code > b.specimen.institution_code)
              return 1

            // institution_code is equal, compare collection_code, considering null values
            if (!a.specimen.collection_code) return 1
            if (!b.specimen.collection_code) return -1
            if (a.specimen.collection_code < b.specimen.collection_code)
              return -1
            if (a.specimen.collection_code > b.specimen.collection_code)
              return 1

            // institution_code and collection_code are equal, compare catalog_number, considering null values
            if (!a.specimen.catalog_number) return 1
            if (!b.specimen.catalog_number) return -1
            if (a.specimen.catalog_number < b.specimen.catalog_number) return -1
            if (a.specimen.catalog_number > b.specimen.catalog_number) return 1

            // when all fields are equal sort by media_id
            return a.media_id - b.media_id
          })
          break
        case 'view':
          this.media_files.sort((a, b) => {
            if (!a.view_name) return 1
            if (!b.view_name) return -1
            const compareResult = a.view_name
              .toLowerCase()
              .localeCompare(b.view_name.toLowerCase())
            // when view_name is the same sort by media_id
            if (compareResult == 0) {
              return a.media_id - b.media_id
            }
            return compareResult
          })
          break
        case 'user':
          this.media_files.sort((a, b) => {
            if (!a.user_lname) return 1
            if (!b.user_lname) return -1
            const compareResult = a.user_lname
              .toLowerCase()
              .localeCompare(b.user_lname.toLowerCase())
            // when lname is the same sort by media_id
            if (compareResult == 0) {
              return a.media_id - b.media_id
            }
            return compareResult
          })
          break
        case 'phylum':
          this.sortByTaxaField('higher_taxon_phylum')
          break
        case 'class':
          this.sortByTaxaField('higher_taxon_class')
          break
        case 'order':
          this.sortByTaxaField('higher_taxon_order')
          break
        case 'superfamily':
          this.sortByTaxaField('higher_taxon_superfamily')
          break
        case 'family':
          this.sortByTaxaField('higher_taxon_family')
          break
        case 'subfamily':
          this.sortByTaxaField('higher_taxon_subfamily')
          break
        case 'genus':
          this.sortByTaxaField('genus')
          break
        case 'species':
          this.sortByTaxaField('specific_epithet')
          break
      }
    },

    sortByTaxaField(field) {
      this.media_files.sort((a, b) => {
        if (!a.taxon_sort_fields || !a.taxon_sort_fields[field]) return 1
        if (!b.taxon_sort_fields || !b.taxon_sort_fields[field]) return -1
        const compareResult = a.taxon_sort_fields[field]
          .toLowerCase()
          .localeCompare(b.taxon_sort_fields[field].toLowerCase())
        // when result is the same sort by media_id
        if (compareResult == 0) {
          return a.media_id - b.media_id
        }
        return compareResult
      })
    },

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
        var getter = axios.create()
        delete getter.defaults.headers.common['Authorization']

        const url = `https://mb4-data.s3.us-west-2.amazonaws.com/media_files/prj_${project_id}.json`
        const res = await getter.get(url)
        this.media_files = res.data
        this.full_media_files = res.data
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
