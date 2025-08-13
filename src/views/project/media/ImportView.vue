<script setup lang="ts">
import router from '@/router'
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { TaxaColumns, sortTaxaAlphabetically } from '@/utils/taxa'
import { Filter } from '@/types/most'
import { toISODate, toDMYDate } from '@/utils/date'

import ImportMediaComponent from '@/components/project/ImportMediaComponent.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import Tooltip from '@/components/main/Tooltip.vue'

interface ImportInfo {
  no_results_on: number | null
  set_on: number | null
}

interface ImportResult {
  taxon_id: number
  link: string
  media: ImportMedia[]
}

interface ImportMedia {
  id: string
  url: string
  copyright_info: string
  copyright_permission: number
  copyright_license: number
  imported?: boolean
  should_import?: boolean
  should_add_as_exemplar?: boolean
}

const route = useRoute()
const projectId = route.params.id
const importType = route.meta.importType
const importText = importType == 'eol' ? 'Eol.org' : 'iDigBio.org'

const filters = reactive<Filter>({})
const taxaStore = useTaxaStore()
const filteredTaxa = computed(() => {
  const filtered = Object.values(filters).reduce(
    (taxa, filter) => taxa.filter(filter),
    taxaStore.taxa
  )

  return sortTaxaAlphabetically(filtered, TaxaColumns.GENUS)
})

const isLoaded = computed(() => taxaStore.isLoaded)
const hasNoResult = computed(() =>
  Array.from(importResults.value.values()).some((v) => v.no_results_on > 0)
)
const hasUnselectedUnsearchedRecords = computed(() => {
  return taxaStore.taxa.some((taxon: any) => {
    const importResult = importResults.value.get(taxon.taxon_id)
    return !taxon.selected && (!importResult || (!importResult.set_on && !importResult.no_results_on))
  })
})

// Pagination
const selectedPage = ref(1)
const selectedPageSize = ref(50)

const totalPages = computed(() => {
  const pageSize = Math.max(1, selectedPageSize.value)
  return Math.ceil(filteredTaxa.value.length / pageSize)
})

const paginatedTaxa = computed(() => {
  const start = (selectedPage.value - 1) * selectedPageSize.value
  const end = start + selectedPageSize.value
  return filteredTaxa.value.slice(start, end)
})

const importResults = ref<Map<number, ImportInfo>>(
  new Map<number, ImportInfo>()
)
const mediaResults = ref<Map<number, ImportResult>>(
  new Map<number, ImportResult>()
)
const isLoadingMedia = ref(false)
const isImportingMedia = ref(false)
const fetchError = ref<string | null>(null)
const failedTaxaIds = ref<number[]>([])

// Computed properties to separate taxa with and without media
const taxaWithMedia = computed(() => {
  const taxaIds: number[] = []
  for (const [taxonId, results] of mediaResults.value) {
    if (results.media && results.media.length > 0) {
      taxaIds.push(taxonId)
    }
  }
  return taxaIds
})

const taxaWithNoMedia = computed(() => {
  const taxaIds: number[] = []
  for (const [taxonId, results] of mediaResults.value) {
    if (!results.media || results.media.length === 0) {
      taxaIds.push(taxonId)
    }
  }
  return taxaIds
})

function moveToStep(step: string) {
  const steps = document.getElementsByClassName('btn-circle')
  for (let i = 0; i < steps.length; i++) {
    steps.item(i).classList.remove('btn-primary')
  }

  const step2 = document.querySelector(`.btn-circle[href="#${step}"]`)
  step2.classList.add('btn-primary')

  const stepContents = document.querySelectorAll<HTMLElement>('.setup-content')
  for (let i = 0; i < stepContents.length; i++) {
    stepContents.item(i).style.display = 'none'
  }

  const stepContent = document.getElementById(step)
  stepContent.style.display = 'unset'

  window.scrollTo(0, 0)

  return false
}

function selectFirst100() {
  let total = 0
  for (const taxon of taxaStore.taxa) {
    const taxonId = taxon.taxon_id
    const importResult = importResults.value.get(taxonId)
    if (!importResult.no_results_on && !importResult.set_on) {
      taxon.selected = true
      if (++total >= 100) {
        break
      }
    }
  }
  return false
}

function selectNoResult() {
  // Don't clear existing selections - make this additive
  let total = 0
  for (const taxon of taxaStore.taxa) {
    const taxonId = taxon.taxon_id
    const importResult = importResults.value.get(taxonId)
    // Select taxa that were searched but had no results
    if (importResult && importResult.no_results_on > 0) {
      if (!taxon.selected) {
        taxon.selected = true
        total++
        if (total >= 100) break
      }
    }
  }
  return false
}

function selectUnsearchedRecords() {
  // Don't clear existing selections - make this additive
  let total = 0
  for (const taxon of taxaStore.taxa) {
    const taxonId = taxon.taxon_id
    const importResult = importResults.value.get(taxonId)
    // Select taxa that have never been searched (no set_on and no no_results_on)
    if (!importResult || (!importResult.set_on && !importResult.no_results_on)) {
      if (!taxon.selected) {
        taxon.selected = true
        total++
        if (total >= 100) break
      }
    }
  }
  return false
}

function selectNext100UnsearchedRecords() {
  // Get count of currently selected unsearched taxa to determine offset
  const alreadySelectedUnsearched = taxaStore.taxa.filter((taxon: any) => {
    const importResult = importResults.value.get(taxon.taxon_id)
    return taxon.selected && (!importResult || (!importResult.set_on && !importResult.no_results_on))
  }).length
  
  // Find unsearched taxa and select the next batch
  let skippedCount = 0
  let selectedCount = 0
  
  for (const taxon of taxaStore.taxa) {
    const taxonId = taxon.taxon_id
    const importResult = importResults.value.get(taxonId)
    // Find unsearched taxa
    if (!importResult || (!importResult.set_on && !importResult.no_results_on)) {
      if (!taxon.selected) {
        // This is an unselected unsearched taxon
        if (skippedCount < alreadySelectedUnsearched) {
          skippedCount++
        } else {
          taxon.selected = true
          selectedCount++
          if (selectedCount >= 100) break
        }
      }
    }
  }
  return false
}

function selectAll() {
  for (const taxon of taxaStore.taxa) {
    taxon.selected = true
  }
  return false
}

function unselectAll() {
  for (const taxon of taxaStore.taxa) {
    taxon.selected = false
  }
  return false
}

function selectAllForImport(shouldImport = true, shouldAddAsExemplar = true) {
  const resultsValues = Array.from(mediaResults.value.values())
  for (const results of resultsValues) {
    for (const result of results.media) {
      result.should_import = shouldImport
      result.should_add_as_exemplar = shouldAddAsExemplar
    }
  }
}

// Watch for page size changes
watch(selectedPageSize, () => {
  selectedPage.value = 1
})

async function fecthMediaForSelectedTaxa() {
  const selectedTaxaIds = taxaStore.taxa
    .filter((taxon: any) => taxon.selected)
    .map((taxon: any) => taxon.taxon_id)
  if (selectedTaxaIds.length > 100) {
    alert(
      `You selected ${
        selectedTaxaIds.length
      } taxa. Only a maximum of 100 taxa can be queried at a time. Please unselect ${
        selectedTaxaIds.length - 100
      } taxa to continue.`
    )
    return
  }

  isLoadingMedia.value = true
  fetchError.value = null
  failedTaxaIds.value = []
  
  // Clear any previous media results for the selected taxa to ensure fresh state
  for (const taxonId of selectedTaxaIds) {
    mediaResults.value.delete(taxonId)
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/${importType}/media`,
      { taxon_ids: selectedTaxaIds }
    )

    if (response.status != 200) {
      throw new Error(`Server returned status ${response.status}`)
    }

    mediaResults.value.clear()
    const processedTaxaIds: number[] = []
    
    for (const result of response.data.results) {
      const taxonId = parseInt(result.taxon_id)
      mediaResults.value.set(taxonId, result)
      processedTaxaIds.push(taxonId)
    }
    
    // Check if some taxa were not processed (partial failure)
    const unprocessedTaxaIds = selectedTaxaIds.filter(id => !processedTaxaIds.includes(id))
    if (unprocessedTaxaIds.length > 0) {
      failedTaxaIds.value = unprocessedTaxaIds
      const taxaNames = unprocessedTaxaIds.map(taxonId => {
        const taxon = taxaStore.getTaxonById(taxonId)
        return getTaxonDisplayName(taxon)
      }).join(', ')
      
      fetchError.value = `There was a problem contacting ${importText}. Some or all of your requested taxa were not searched for. Please try your request again for the following taxa: ${taxaNames}`
    }

    moveToStep('step-2')
  } catch (error) {
    console.error('Error fetching media:', error)
    
    // For complete failures, list all selected taxa
    failedTaxaIds.value = selectedTaxaIds
    const taxaNames = selectedTaxaIds.map(taxonId => {
      const taxon = taxaStore.getTaxonById(taxonId)
      return getTaxonDisplayName(taxon)
    }).join(', ')
    
    // Provide user-friendly error messages
    if (error.response?.status === 500) {
      fetchError.value = `There was a problem contacting ${importText}. Some or all of your requested taxa were not searched for. Please try your request again for the following taxa: ${taxaNames}`
    } else if (error.response?.status === 503) {
      fetchError.value = `${importText} service is temporarily unavailable. Please try again later for the following taxa: ${taxaNames}`
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      fetchError.value = `There was an issue with the request to ${importText}. Please check your taxa selection and try again for the following taxa: ${taxaNames}`
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      fetchError.value = `There was a problem contacting ${importText}. Some or all of your requested taxa were not searched for. Please try your request again for the following taxa: ${taxaNames}`
    } else {
      fetchError.value = `There was a problem contacting ${importText}. Some or all of your requested taxa were not searched for. Please try your request again for the following taxa: ${taxaNames}`
    }
  } finally {
    isLoadingMedia.value = false
  }
  return false
}

async function fetchMoreMedia(taxonId: number) {
  const results = mediaResults.value.get(taxonId)
  const currentCount = results.media.length
  
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/${importType}/media`,
      { 
        taxon_ids: [taxonId], 
        size: currentCount + 12  // Request 12 additional images
      }
    )

    if (response.status != 200) {
      throw new Error(`Server returned status ${response.status}`)
    }

    const newResults = response.data.results[0]
    const previousMediaCount = currentCount
    const newMediaCount = newResults.media ? newResults.media.length : 0
    
    if (newMediaCount > previousMediaCount) {
      // New media found - update the results
      mediaResults.value.set(taxonId, newResults)
      
      const additionalCount = newMediaCount - previousMediaCount
      
      // If we got fewer than 12 additional images, there are no more available
      // But we still found some, so this is a success with auto-disable
      if (additionalCount < 12) {
        // Signal that we should auto-disable after showing success message
        throw new Error('AUTO_DISABLE_AFTER_SUCCESS')
      }
    } else {
      // No new media found
      throw new Error('NO_NEW_MEDIA')
    }
  } catch (error) {
    console.error('Error fetching more media:', error)
    
    // Re-throw with specific error types for the component to handle
    if (error.message === 'AUTO_DISABLE_AFTER_SUCCESS') {
      // This is a special case: we found media but < 12, so show success then auto-disable
      throw new Error('AUTO_DISABLE_AFTER_SUCCESS')
    } else if (error.message === 'NO_NEW_MEDIA') {
      throw new Error('No additional media were found')
    } else if (error.response?.status >= 500) {
      throw new Error(`There was a problem contacting ${importText}, please try your request again later`)
    } else {
      throw new Error(`Failed to fetch additional media from ${importText}`)
    }
  }
}

async function importMediaForSelectedTaxa() {
  // Iterate through the media results and only import values that were selected
  // by the user.
  const selected: ImportResult[] = []
  const resultsValues = Array.from(mediaResults.value.values())
  for (const resultValue of resultsValues) {
    const taxonId = resultValue.taxon_id
    const link = resultValue.link
    const media: ImportMedia[] = []
    for (const resultMedia of resultValue.media) {
      if (resultMedia.should_import) {
        media.push(resultMedia)
      }
    }
    if (media.length > 0) {
      selected.push({
        taxon_id: taxonId,
        link,
        media,
      })
    }
  }

  if (selected.length == 0) {
    alert('Please select media to import')
    return
  }

  isImportingMedia.value = true
  
  try {
    const response = await axios.post(
      `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/${importType}/import`,
      { imports: selected }
    )

    if (response.status != 200) {
      alert('Failed to import the media')
      return
    }

    if (!response.data.success) {
      alert(
        'Failed to import media: ' + (response.data.message ?? 'Unknown issue')
      )
      return
    }

    // Clear the import list and media results since media have been imported
    // thus these are invalidated.
    mediaResults.value.clear()
    importResults.value.clear()

    alert(
      'You have successfully imported the media into Morphobank but you curate them before they can be released into your import.'
    )
    
    // Use a small timeout to ensure the alert is dismissed before redirect
    setTimeout(() => {
      // Try using route name instead of path for more reliable navigation
      router.replace({ 
        name: 'MyProjectMediaCurateView', 
        params: { id: projectId } 
      }).catch(() => {
        // Fallback to path-based navigation
        router.replace({ path: `/myprojects/${projectId}/media/curate` }).catch(() => {
          // Final fallback to window.location
          window.location.href = `/myprojects/${projectId}/media/curate`
        })
      })
    }, 100)
  } catch (error) {
    console.error('Error importing media:', error)
    alert('Failed to import media. Please try again.')
  } finally {
    isImportingMedia.value = false
  }
}

onMounted(async () => {
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }

  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/projects/${projectId}/${importType}`
  )
  for (const result of response.data.results) {
    const taxonId = parseInt(result.taxon_id)
    importResults.value.set(taxonId, result)
  }
})

// Helper function to get taxon display name
function getTaxonDisplayName(taxon: any): string {
  if (!taxon) return 'Unknown taxon'
  
  const parts = []
  if (taxon.genus) parts.push(taxon.genus)
  if (taxon.species) parts.push(taxon.species)
  if (taxon.subspecies) parts.push(taxon.subspecies)
  
  if (parts.length === 0) {
    // Fallback to other taxonomic levels
    if (taxon.family) return taxon.family
    if (taxon.order) return taxon.order
    if (taxon.class) return taxon.class
    return 'Unknown taxon'
  }
  
  return parts.join(' ')
}

// Helper function to retry failed taxa
async function retryFailedTaxa() {
  if (failedTaxaIds.value.length === 0) return

  // Clear any stale error state before retry
  fetchError.value = null

  // Clear any stale media results for failed taxa
  for (const taxonId of failedTaxaIds.value) {
    mediaResults.value.delete(taxonId)
  }

  // Temporarily select only the failed taxa
  for (const taxon of taxaStore.taxa) {
    taxon.selected = failedTaxaIds.value.includes(taxon.taxon_id)
  }
  
  // Retry the fetch
  await fecthMediaForSelectedTaxa()
}

// Helper function to get timestamp display info for a taxon
function getTimestampInfo(taxon: any) {
  if (!taxon) return null
  
  const importResult = importResults.value.get(taxon.taxon_id)
  
  // Check for import type specific timestamps
  const isEol = importType === 'eol'
  
  // First check import results for set_on and no_results_on
  if (importResult?.set_on) {
    return {
      type: 'imported',
      timestamp: importResult.set_on,
      label: 'Already imported',
      class: 'text-success'
    }
  } else if (importResult?.no_results_on) {
    return {
      type: 'no_results',
      timestamp: importResult.no_results_on,
      label: 'No results found',
      class: 'text-warning'
    }
  }
  
  // Then check taxon object for pulled timestamps
  const pulledTimestamp = isEol ? taxon.eol_pulled_on : taxon.idigbio_pulled_on
  const noResultsTimestamp = isEol ? taxon.eol_no_results_on : taxon.idigbio_no_results_on
  const setTimestamp = isEol ? taxon.eol_set_on : taxon.idigbio_set_on
  
  if (setTimestamp) {
    return {
      type: 'imported',
      timestamp: setTimestamp,
      label: 'Already imported',
      class: 'text-success'
    }
  } else if (noResultsTimestamp) {
    return {
      type: 'no_results',
      timestamp: noResultsTimestamp,
      label: 'No results found',
      class: 'text-warning'
    }
  } else if (pulledTimestamp) {
    return {
      type: 'pulled',
      timestamp: pulledTimestamp,
      label: 'Last searched',
      class: 'text-info'
    }
  }
  
  return null
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
      <i class="fa-solid fa-chevron-left"></i>
      <RouterLink
        :to="`/myprojects/${projectId}/media/`"
        class="nav-link m-0 p-0 pl-1"
      >
        Back to Media
      </RouterLink>
    </div>
    <div v-if="taxaStore.taxa.length == 0">Your project has no taxa</div>
    <div class="stepwizard" v-else>
      <div class="import-step-row setup-panel">
        <hr />
        <div class="import-step">
          <a href="#step-1" type="button" class="btn btn-primary btn-circle">
            1
          </a>
          <p>Select</p>
        </div>
        <div class="import-step">
          <a
            href="#step-2"
            type="button"
            class="btn btn-default btn-circle"
            disabled="disabled"
          >
            2
          </a>
          <p>Import</p>
        </div>
      </div>
      <div>
        <form>
          <div class="row setup-content" id="step-1">
            <span>Select Taxa</span>
            
            <div class="d-flex gap-2 my-3">
              <div v-if="taxaStore.taxa.length > 100">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="selectFirst100">
                  Select first 100
                </button>
              </div>
              <div v-else>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="selectAll">Select all</button>
              </div>
              <div v-if="hasNoResult">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="selectNoResult">
                  Select records with no results
                  <Tooltip
                    :content="`Use this to search ${importText} again since their database is constantly being updated (Only first 100 will be selected)`"
                  >
                  </Tooltip>
                </button>
              </div>
              <div v-if="taxaStore.taxa.length > 100">
                <button 
                  type="button" 
                  :class="hasUnselectedUnsearchedRecords ? 'btn btn-sm btn-outline-primary' : 'btn btn-sm btn-outline-secondary'"
                  @click="selectNext100UnsearchedRecords"
                  :disabled="!hasUnselectedUnsearchedRecords"
                >
                  Select next 100 unsearched records
                  <Tooltip
                    :content="hasUnselectedUnsearchedRecords ? `Select the next batch of 100 taxa that have not been searched in ${importText}` : 'No more unsearched records available'"
                  >
                  </Tooltip>
                </button>
              </div>
              <div v-else>
                <button 
                  type="button" 
                  :class="hasUnselectedUnsearchedRecords ? 'btn btn-sm btn-outline-primary' : 'btn btn-sm btn-outline-secondary'"
                  @click="selectUnsearchedRecords"
                  :disabled="!hasUnselectedUnsearchedRecords"
                >
                  Select unsearched records
                  <Tooltip
                    :content="hasUnselectedUnsearchedRecords ? `Select taxa that have not been searched in ${importText}` : 'No more unsearched records available'"
                  >
                  </Tooltip>
                </button>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="unselectAll">Unselect all</button>
              </div>
            </div>
            
            <p class="mb-3">
              Use the checkboxes to indicate which taxa you would like to search
              for on {{ importText }}. You will be presented image results to
              selectively import for use as
              <b>taxon exemplars</b>
              <Tooltip
                content="Taxon exemplars appear in matrices to illustrate a taxon"
              />. Unvouchered specimens will be created for these new media
              files if they are not already available for the taxon.
            </p>
            
            <p class="mb-3">
              <i>
                Taxa for which Media have already been imported from
                {{ importText }} will appear gray.
              </i>
            </p>

            <!-- Pagination Controls -->
            <div class="d-flex justify-content-between align-items-center mb-3" v-if="filteredTaxa.length > 25">
              <div class="pagination-controls-left">
                <span class="me-2">Items per page:</span>
                <select v-model="selectedPageSize" class="form-select form-select-sm pagination-select">
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
              <div class="pagination-controls-right">
                <span class="me-2">Page:</span>
                <select v-model="selectedPage" class="form-select form-select-sm pagination-select">
                  <option v-for="page in totalPages" :key="page" :value="page">
                    {{ page }}
                  </option>
                </select>
                <span class="ms-2">of {{ totalPages }} ({{ filteredTaxa.length }} total taxa)</span>
              </div>
            </div>

            <div class="taxa-container">
              <div class="grid">
                <div
                  v-for="taxon in paginatedTaxa"
                  :key="taxon.taxon_id"
                  class="grid-item"
                >
                <input
                  class="form-check-input"
                  :id="'ci' + taxon.taxon_id"
                  type="checkbox"
                  v-model="taxon.selected"
                />
                <label class="grid-item-name" :for="'ci' + taxon.taxon_id">
                  <div class="taxon-info-row">
                    <div class="taxon-name-container">
                      <TaxonomicName
                        :class="{
                          greyed:
                            importResults.get(taxon.taxon_id)?.no_results_on ||
                            importResults.get(taxon.taxon_id)?.set_on,
                        }"
                        :showExtinctMarker="true"
                        :taxon="taxon"
                      />
                    </div>
                    <div v-if="getTimestampInfo(taxon)" class="timestamp-info">
                      <small :class="getTimestampInfo(taxon).class">
                        <i class="fa fa-clock me-1"></i>
                        {{ getTimestampInfo(taxon).label }}: {{ toDMYDate(getTimestampInfo(taxon).timestamp) }}
                      </small>
                    </div>
                    <!-- Fallback to old display if no timestamp info -->
                    <div v-else-if="importResults.get(taxon.taxon_id)" class="timestamp-info">
                      <small v-if="importResults.get(taxon.taxon_id)?.set_on" class="text-success">
                        <i class="fa fa-check me-1"></i>
                        Already imported
                      </small>
                      <small v-else-if="importResults.get(taxon.taxon_id)?.no_results_on" class="text-warning">
                        <i class="fa fa-exclamation-triangle me-1"></i>
                        No results ({{ toISODate(importResults.get(taxon.taxon_id)?.no_results_on) }})
                      </small>
                    </div>
                  </div>
                </label>
              </div>
              </div>
            </div>
            <div class="btn-step-group">
              <button
                type="button"
                class="btn btn-outline-primary btn-step-prev"
                @click="$router.go(-1)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary btn-step-next"
                @click="fecthMediaForSelectedTaxa"
                :disabled="isLoadingMedia"
              >
                <span
                  v-if="isLoadingMedia"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ isLoadingMedia ? 'Searching...' : 'Next' }}
              </button>
            </div>
          </div>
          <div class="row setup-content" id="step-2">
            <div v-if="isLoadingMedia" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3">Searching {{ importText }} for media...</p>
            </div>
            <div v-else-if="fetchError" class="alert alert-danger my-4" role="alert">
              <h5 class="alert-heading">
                <i class="fa-solid fa-exclamation-triangle me-2"></i>
                Search Failed
              </h5>
              <p class="mb-0">{{ fetchError }}</p>
              <hr>
              <div class="d-flex gap-2 mb-0">
                <button 
                  type="button" 
                  class="btn btn-outline-danger btn-sm"
                  @click="moveToStep('step-1')"
                >
                  <i class="fa-solid fa-arrow-left me-1"></i>
                  Back to Selection
                </button>
                <button 
                  v-if="failedTaxaIds.length > 0"
                  type="button" 
                  class="btn btn-danger btn-sm"
                  @click="retryFailedTaxa()"
                  :disabled="isLoadingMedia"
                >
                  <span v-if="isLoadingMedia">
                    <i class="fa fa-spinner fa-spin me-1"></i>
                    Retrying...
                  </span>
                  <span v-else>
                    <i class="fa-solid fa-refresh me-1"></i>
                    Retry Failed Taxa ({{ failedTaxaIds.length }})
                  </span>
                </button>
                <button 
                  type="button" 
                  class="btn btn-danger btn-sm"
                  @click="fetchError = null; fecthMediaForSelectedTaxa()"
                  :disabled="isLoadingMedia"
                >
                  <span v-if="isLoadingMedia">
                    <i class="fa fa-spinner fa-spin me-1"></i>
                    Retrying...
                  </span>
                  <span v-else>
                    <i class="fa-solid fa-refresh me-1"></i>
                    Retry All
                  </span>
                </button>
              </div>
            </div>
            <div v-else-if="mediaResults.size > 0" class="row">
              <!-- Top Section: Taxa with No Media Found -->
              <div v-if="taxaWithNoMedia.length > 0" class="col-12 mb-4">
                <h5 class="mb-3 text-warning">
                  <i class="fa fa-exclamation-triangle me-2"></i>
                  Taxa with No Media Found ({{ taxaWithNoMedia.length }})
                </h5>
                <div class="alert alert-warning">
                  <p class="mb-2">The following taxa had no media available on {{ importText }}:</p>
                  <div class="d-flex flex-wrap gap-2">
                    <span 
                      v-for="taxonId in taxaWithNoMedia" 
                      :key="taxonId"
                      class="badge bg-warning text-dark"
                    >
                      <TaxonomicName
                        :showExtinctMarker="true"
                        :taxon="taxaStore.getTaxonById(taxonId)"
                      />
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Main Section: Taxa with Media Found -->
              <div class="col-12">
                <h5 class="mb-3 text-mb">
                  <i class="fa fa-images me-2"></i>
                  Taxa with Media Found ({{ taxaWithMedia.length }})
                </h5>
                <div class="d-flex gap-2 mb-3">
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="selectAllForImport(true, false)">
                    <i class="fa fa-check"></i>
                    <span> Select all for import</span>
                  </button>
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="selectAllForImport(true, true)">
                    <i class="fa fa-star"></i>
                    <span> Select all for import/exemplar</span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="selectAllForImport(false, false)">
                    <i class="fa fa-times"></i>
                    <span> Deselect all</span>
                  </button>
                </div>
                <div class="d-flex flex-column gap-3">
                  <div
                    v-for="taxonId in taxaWithMedia"
                    :key="taxonId"
                    class="card"
                  >
                    <div class="card-body">
                      <ImportMediaComponent
                        :taxon="taxaStore.getTaxonById(taxonId)"
                        :importText="importText"
                        :results="mediaResults.get(taxonId)"
                        :fetchMoreMedia="() => fetchMoreMedia(taxonId)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="!isLoadingMedia">No results from {{ importText }}</div>
            <div class="btn-step-group">
              <button
                class="btn btn-primary btn-step-prev"
                type="button"
                @click="moveToStep('step-1')"
              >
                Prev
              </button>
              <button
                type="button"
                class="btn btn-primary btn-step-next"
                @click="importMediaForSelectedTaxa"
                :disabled="isImportingMedia"
              >
                <span v-if="isImportingMedia">
                  <i class="fa fa-spinner fa-spin me-2"></i>
                  Importing...
                </span>
                <span v-else>
                  Import
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </LoadingIndicator>
</template>
<style scoped>
@import '@/views/project/steps.css';

.taxa-container {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #f8f9fa;
  overflow: visible;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.grid-item {
  display: flex;
}

.grid-item .form-check-input {
  margin: auto 5px;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.15s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 1rem;
}

.no-results {
  color: red;
  font-style: italic;
  font-weight: 100;
}

.already-imported {
  color: blue;
  font-style: italic;
  font-weight: 100;
}

.greyed {
  color: #828282;
}

.grid-item:nth-of-type(even) {
  background-color: #fff;
}

.grid-item:nth-of-type(odd) {
  background-color: #f7f7f7;
}

.card-title {
  color: #495057;
  font-weight: 600;
}

.text-morpho-orange {
  color: #ef782f !important;
}

.timestamp-info {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.timestamp-info .fa-clock {
  opacity: 0.7;
}

.grid-item-name {
  display: flex;
  flex-direction: column;
}

.taxon-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.taxon-name-container {
  flex-grow: 1;
}

.pagination-controls-left,
.pagination-controls-right {
  position: relative;
  z-index: 1000;
}

.pagination-select {
  width: auto !important;
  display: inline-block !important;
  min-width: 70px;
  position: relative;
  z-index: 1001;
}

.timestamp-info {
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
