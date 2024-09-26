import axios from 'axios'
import { defineStore } from 'pinia'
import { searchInObject } from '@/utils/util.js'

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
    folios: null,
    matrices: null,
    media: null,
    media_views: null,
    specimen_details: null,
    unidentified_specimen_details: null,

    specimenFilterByOptions: {
      supraspecific_clade: 'supraspecific clade',
      higher_taxon_phylum: 'phylum',
      higher_taxon_class: 'class',
      higher_taxon_order: 'order',
      higher_taxon_superfamily: 'superfamily',
      higher_taxon_family: 'family',
      higher_taxon_subfamily: 'subfamily',
      genus: 'genus',
      specific_epithet: 'species',
      subspecific_epithet: 'subspecies',
    },

    specimenSortByFields: [
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

    taxaFilterByOptions: {
      supraspecific_clade: 'supraspecific clade',
      higher_taxon_kingdom: 'kingdom',
      higher_taxon_phylum: 'phylum',
      higher_taxon_class: 'class',
      higher_taxon_subclass: 'subclass',
      higher_taxon_infraclass: 'infraclass',
      higher_taxon_cohort: 'cohort',
      higher_taxon_superorder: 'superorder',
      higher_taxon_order: 'order',
      higher_taxon_suborder: 'suborder',
      higher_taxon_infraorder: 'infraorder',
      higher_taxon_superfamily: 'superfamily',
      higher_taxon_family: 'family',
      higher_taxon_subfamily: 'subfamily',
      higher_taxon_tribe: 'tribe',
      higher_taxon_subtribe: 'subtribe',
      genus: 'genus',
      subgenus: 'subgenus',
      specific_epithet: 'species',
      subspecific_epithet: 'subspecies',
    },

    taxaSortByFields: [
      'genus',
      'subgenus',
      'specific_epithet',
      'subspecific_epithet',
      'higher_taxon_subtribe',
      'higher_taxon_tribe',
      'higher_taxon_subfamily',
      'higher_taxon_family',
      'higher_taxon_superfamily',
      'higher_taxon_infraorder',
      'higher_taxon_suborder',
      'higher_taxon_order',
      'higher_taxon_superorder',
      'higher_taxon_cohort',
      'higher_taxon_infraclass',
      'higher_taxon_subclass',
      'higher_taxon_class',
      'higher_taxon_phylum',
      'higher_taxon_kingdom',
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
        // add a default sort
        this.sortTaxaInDefaultOrder()
        this.partitions = res.data.partitions
        this.bibliography = res.data.bibliography
        this.docs = res.data.docs
        this.folios = res.data.folios

        this.matrices = res.data.overview.matrices
        this.media_views = res.data.media_views
        this.specimen_details = res.data.specimen_details
        // add a default sort
        this.sortSpecimenInDefaultOrder()
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
    // get folio view count
    getFolioViewCount(folioId) {
      return this.overview?.project_views?.details?.F?.filter(
        (f) => f.rowId == folioId
      )?.[0]?.val
    },
    // get folio info
    getFolioInfo(folioId) {
      return this.folios?.filter((f) => f.folio_id == folioId)?.[0]
    },
    // specimen details function
    sortSpecimenInDefaultOrder() {
      this.specimen_details = this.specimen_details.sort((a, b) =>
        this.sortByFields(
          a.sort_fields,
          b.sort_fields,
          this.specimenSortByFields
        )
      )
    },
    getDefaultSpecimenFilter() {
      return this.getDefaultFilterField(
        this.specimenSortByFields,
        this.specimen_details
      )
    },
    getSpecimenFilterFields() {
      return this.getFilterFields(
        this.specimenFilterByOptions,
        this.specimen_details
      )
    },
    getFilteredSpecimen(showAll, filterBy, letter) {
      return this.getFilteredElements(
        showAll,
        filterBy,
        letter,
        this.specimen_details,
        this.specimenSortByFields
      )
    },
    getFilteredSpecimenInitials(filterBy) {
      return this.getFilteredElementsInitials(filterBy, this.specimen_details)
    },
    // taxa details function
    sortTaxaInDefaultOrder() {
      this.taxa_details = this.taxa_details.sort((a, b) =>
        this.sortByFields(a.sort_fields, b.sort_fields, this.taxaSortByFields)
      )
    },
    getDefaultTaxaPartitionField() {
      if (
        (!this.partitions || this.partitions.length == 0) &&
        (!this.matrices || this.matrices.length == 0)
      )
        return null
      if (this.partitions && this.partitions.length > 0) {
        return `P${this.partitions[0].partition_id}`
      }
      if (this.matrices && this.matrices.length > 0) {
        return `M${this.matrices[0].matrix_id}`
      }
    },
    getTaxaPartitionFields() {
      if (
        (!this.partitions || this.partitions.length == 0) &&
        (!this.matrices || this.matrices.length == 0)
      )
        return null
      const fields = {}
      for (let partition of this.partitions) {
        // only display fields that have taxa
        if (
          this.taxa_details &&
          this.taxa_details.some(
            (item) =>
              item.partitions &&
              item.partitions
                .map(Number)
                .includes(Number(partition.partition_id))
          )
        ) {
          fields[`P${partition.partition_id}`] = `partition: ${partition.name}`
        }
      }
      for (let matrix of this.matrices) {
        fields[`M${matrix.matrix_id}`] = `matrix: ${matrix.title}`
      }
      return fields
    },
    getDefaultTaxaFilter() {
      return this.getDefaultFilterField(
        this.taxaSortByFields,
        this.taxa_details
      )
    },
    getTaxaFilterFields() {
      return this.getFilterFields(this.taxaFilterByOptions, this.taxa_details)
    },
    getFilteredTaxa(filterType, filterBy, letter, partitionBy, searchStr) {
      // when search str presents, show search result
      switch (filterType) {
        case 'Search':
          if (searchStr) return this.searchForTaxa(searchStr)
          return this.taxa_details
        case 'Partition':
          return this.getPartitionedTaxa(partitionBy)
        case 'Taxa':
          return this.getFilteredElements(
            false,
            filterBy,
            letter,
            this.taxa_details,
            this.taxaSortByFields
          )
        case 'All':
          return this.taxa_details
      }
    },
    getPartitionedTaxa(partitionBy) {
      const partitionIdPattern = /^P(\d+)$/
      let partitionMatch = partitionBy.match(partitionIdPattern)
      if (partitionMatch) {
        let partitionId = Number(partitionMatch[1]) // Remove the 'P' and get the digits
        return this.taxa_details.filter(
          (item) =>
            item.partitions && item.partitions.map(Number).includes(partitionId)
        )
      }
      const matrixIdPattern = /^M(\d+)$/
      let matrixMatch = partitionBy.match(matrixIdPattern)
      if (matrixMatch) {
        let matrixId = Number(matrixMatch[1]) // Remove the 'M' and get the digits
        return this.taxa_details.filter(
          (item) =>
            item.matrices && item.matrices.map(Number).includes(matrixId)
        )
      }
    },
    getFilteredTaxaInitials(filterBy) {
      return this.getFilteredElementsInitials(filterBy, this.taxa_details)
    },
    getSupraTaxa() {
      return this.taxa_details.filter(
        (obj) =>
          !obj.sort_fields['genus'] &&
          !obj.sort_fields['specific_epithet'] &&
          !obj.sort_fields['subspecific_epithet']
      )
    },
    getGenusTaxa() {
      return this.taxa_details.filter(
        (obj) =>
          obj.sort_fields['genus'] ||
          obj.sort_fields['specific_epithet'] ||
          obj.sort_fields['subspecific_epithet']
      )
    },
    // assume no need for sorting since the original arr is already sorted
    searchForTaxa(searchStr) {
      return this.taxa_details.filter((item) =>
        searchInObject(item.sort_fields, searchStr, this.taxaSortByFields)
      )
    },
    // general function
    getDefaultFilterField(sortByFields, arr) {
      for (const key in sortByFields) {
        // Check if any item has a valid (non-null and non-undefined) value for the key
        let hasValidValue = false
        if (arr) {
          hasValidValue = arr.some(
            (item) => item['sort_fields'][sortByFields[key]]
          )
        }

        // If no items have a valid value for the key, delete it from specimenFilterByOptions
        if (hasValidValue) {
          return sortByFields[key]
        }
      }
    },
    getFilterFields(filterByOptions, arr) {
      const cleanedFilterByOptions = { ...filterByOptions }

      for (const key in cleanedFilterByOptions) {
        // Check if any item has a valid (non-null and non-undefined) value for the key
        let hasValidValue = false
        if (arr) {
          hasValidValue = arr.some((item) => item['sort_fields'][key])
        }

        // If no items have a valid value for the key, delete it from specimenFilterByOptions
        if (!hasValidValue) {
          delete cleanedFilterByOptions[key]
        }
      }
      return cleanedFilterByOptions
    },
    getFilteredElements(showAll, filterBy, letter, arr) {
      if (showAll) {
        return arr
      }
      // assume no need for sorting since the original arr is already sorted
      return arr.filter(
        (obj) => this.getFirstChar(obj.sort_fields[filterBy]) == letter
      )
    },
    getFilteredElementsInitials(filterBy, arr) {
      const uniqueLetters = [
        ...new Set(
          arr
            .filter((obj) => obj.sort_fields[filterBy])
            .map((obj) => this.getFirstChar(obj.sort_fields[filterBy]))
        ),
      ]
      return [...uniqueLetters.sort()]
    },
    sortByFields(a, b, fields) {
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
    },
    getFirstChar(str) {
      if (!str) return ''
      return str
        .replace(/[^a-zA-Z?]/g, '')
        .charAt(0)
        .toUpperCase()
    },
    getMatrixDownloadLink(projectId, matrixId, format, notes) {
      const downloadUrl = `${
        import.meta.env.VITE_API_URL
      }/public/projects/${projectId}/matrices/${matrixId}/download?format=${format}&notes=${notes}`
      return downloadUrl
    },
    getMatrixCharListDownloadLink(projectId, matrixId, notes) {
      const downloadUrl = `${
        import.meta.env.VITE_API_URL
      }/public/projects/${projectId}/matrices/${matrixId}/download/characters?notes=${notes}`
      return downloadUrl
    },
    getMatrixOntologyDownloadLink(projectId, matrixId) {
      const downloadUrl = `${
        import.meta.env.VITE_API_URL
      }/public/projects/${projectId}/matrices/${matrixId}/download/ontology`
      return downloadUrl
    },
  },
})
