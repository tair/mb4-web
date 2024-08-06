import axios from 'axios'
import { defineStore } from 'pinia'

export const usePublicProjectDetailsStore = defineStore({
  id: 'publicProjectDetails',
  state: () => ({
    loading: false,
    loaded: false,
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
    unidentified_specimen_details: null,

    filterByOptions: {
      'supraspecific clade': 'supraspecific_clade',
      phylum: 'higher_taxon_phylum',
      class: 'higher_taxon_class',
      order: 'higher_taxon_order',
      superfamily: 'higher_taxon_superfamily',
      family: 'higher_taxon_family',
      subfamily: 'higher_taxon_subfamily',
      genus: 'genus',
      species: 'specific_epithet',
      subspecies: 'subspecific_epithet',
    },

    sortByFields: [
      'genus',
      'specific_epithet',
      'subspecific_epithet',
      'higher_taxon_subfamily',
      'higher_taxon_family',
      'higher_taxon_superfamily',
      'higher_taxon_order',
      'higher_taxon_suborder',
      'higher_taxon_class',
      'higher_taxon_phylum',
      'supraspecific_clade',
    ],
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
      this.loaded = false
      this.err = null

      try {
        var getter = axios.create()
        delete getter.defaults.headers.common['Authorization']

        const url = `https://mb4-data.s3.us-west-2.amazonaws.com/prj_details/prj_${id}.json`
        const res = await getter.get(url)

        this.overview = res.data.overview
        this.taxa_details = res.data.taxa_details
        this.partitions = res.data.partitions
        this.bibliography = res.data.bibliography
        this.docs = res.data.docs

        this.matrices = res.data.overview.matrices
        this.media_views = res.data.media_views
        this.specimen_details = res.data.specimen_details
        this.unidentified_specimen_details =
          res.data.unidentified_specimen_details

        this.project_id = id
        this.loaded = true
      } catch (e) {
        console.error(`store:projectDetails:fetchProject(): ${e}`)
        this.err = 'Error fetching project list.'
      } finally {
        this.loading = false
      }
    },
    isDownloadValid(id) {
      // hardcoded value to prevent download from extra large project
      return id != 773
    },
    getSpecimenFilterFields() {
      const cleanedFilterByOptions = { ...this.filterByOptions }

      for (const key in cleanedFilterByOptions) {
        // Check if any item has a valid (non-null and non-undefined) value for the key
        const hasValidValue = this.specimen_details.some(
          (item) =>
            item['taxon_sort_fields'][cleanedFilterByOptions[key]] != null
        )

        // If no items have a valid value for the key, delete it from filterByOptions
        if (!hasValidValue) {
          delete cleanedFilterByOptions[key]
        }
      }
      return cleanedFilterByOptions
    },
    getFilteredSpecimen(showAll, filterBy, letter) {
      if (showAll) {
        return this.sortSpecimen(this.specimen_details)
      }
      return this.sortSpecimen(
        this.specimen_details.filter(
          (specimen) =>
            this.getFirstChar(specimen.taxon_sort_fields[filterBy]) == letter
        )
      )
    },
    getFilteredSpecimenInitials(filterBy) {
      const uniqueLetters = [
        ...new Set(
          this.specimen_details
            .filter((specimen) => specimen.taxon_sort_fields[filterBy])
            .map((specimen) =>
              this.getFirstChar(specimen.taxon_sort_fields[filterBy])
            )
        ),
      ]
      return [...uniqueLetters.sort()]
    },
    sortSpecimen(arr) {
      const compare = (a, b, fields) => {
        for (const field of fields) {
          const valA = a[field]
          const valB = b[field]

          // If both values are null, continue to the next field
          if (!valA && !valB) continue

          // If one value is null, it should be considered greater (lower in order)
          if (!valA) return 1
          if (!valB) return -1

          // If both values are non-null, compare them
          if (valA < valB) return -1
          if (valA > valB) return 1
        }
        return 0
      }
      return arr.sort((a, b) =>
        compare(a.taxon_sort_fields, b.taxon_sort_fields, this.sortByFields)
      )
    },
    getFirstChar(str) {
      if (!str) return ''
      return str.charAt(0).toUpperCase()
    },
  },
})
