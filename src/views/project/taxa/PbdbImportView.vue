<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { TaxaColumns, sortTaxaAlphabetically } from '@/utils/taxa'
import { toDMYDate } from '@/utils/date'
import { capitalizeFirstLetter } from '@/utils/string'

import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import Tooltip from '@/components/main/Tooltip.vue'

interface PbdbValidationInfo {
  pbdb_pulled_on: number | null
  pbdb_taxon_id: string | null
}

interface PbdbValidationResult {
  taxon_id: number
  name: string
  pbdb: {
    id: string
    ranks: Record<string, string>
  } | null
}

interface PbdbImportData {
  taxon_id: number
  id: string
  ranks: Record<string, string>
}

const route = useRoute()
const projectId = route.params.id

const taxaStore = useTaxaStore()
const filteredTaxa = computed(() => {
  let baseTaxa = taxaStore.taxa
  
  // If we have preselected taxa, show only those in Step 1
  // Note: All three conditions must be true to filter to preselected taxa
  if (hasPreselectedTaxa.value && currentStep.value === 1 && preselectedTaxaIds.value.length > 0) {
    baseTaxa = baseTaxa.filter(taxon => preselectedTaxaIds.value.includes(taxon.taxon_id))
  }

  return sortTaxaAlphabetically(baseTaxa, TaxaColumns.GENUS)
})

const isLoaded = computed(() => taxaStore.isLoaded)
const hasNoResult = computed(() =>
  Array.from(validationResults.value.values()).some((v) => v.pbdb_pulled_on && !v.pbdb_taxon_id)
)
const selectedTaxaSize = ref(0)
const validationResults = ref<Map<number, PbdbValidationInfo>>(
  new Map<number, PbdbValidationInfo>()
)
const pbdbResults = ref<Map<number, PbdbValidationResult>>(
  new Map<number, PbdbValidationResult>()
)

const isValidating = ref(false)
const isImporting = ref(false)
const validationError = ref<string | null>(null)
const failedTaxaIds = ref<number[]>([])

// Step management
const currentStep = ref(1)
const maxSelectedTaxa = 100
const hasPreselectedTaxa = ref(false)
const preselectedTaxaIds = ref<number[]>([])

// Computed properties to separate taxa with and without PBDB data
const taxaWithPbdbData = computed(() => {
  return filteredTaxa.value.filter((taxon) => {
    const currentSessionResult = pbdbResults.value.get(taxon.taxon_id)
    
    // Only show taxa with current session PBDB data that can actually be imported
    // Historical taxa with pbdb_taxon_id === null are excluded because they need revalidation
    return currentSessionResult && currentSessionResult.pbdb
  })
})

const taxaWithoutPbdbData = computed(() => {
  return filteredTaxa.value.filter((taxon) => {
    const result = pbdbResults.value.get(taxon.taxon_id)
    return pbdbResults.value.has(taxon.taxon_id) && (!result || !result.pbdb)
  })
})

// Taxa in current session that were previously imported
const currentSessionPreviouslyImported = computed(() => {
  return taxaWithPbdbData.value.filter((taxon) => {
    const validationResult = validationResults.value.get(taxon.taxon_id)
    return validationResult && validationResult.pbdb_taxon_id && validationResult.pbdb_taxon_id > 0
  })
})

// Selection functions
function selectAll() {
  const maxToSelect = Math.min(filteredTaxa.value.length, maxSelectedTaxa)
  for (let i = 0; i < maxToSelect; i++) {
    filteredTaxa.value[i].selected = true
  }
}

function selectFirst100() {
  unselectAll()
  const maxToSelect = Math.min(filteredTaxa.value.length, 100)
  for (let i = 0; i < maxToSelect; i++) {
    filteredTaxa.value[i].selected = true
  }
}

function selectNoResult() {
  unselectAll()
  const noResultTaxa = filteredTaxa.value.filter(taxon => {
    const result = validationResults.value.get(taxon.taxon_id)
    return result && result.pbdb_pulled_on && !result.pbdb_taxon_id
  })
  
  const maxToSelect = Math.min(noResultTaxa.length, maxSelectedTaxa)
  for (let i = 0; i < maxToSelect; i++) {
    noResultTaxa[i].selected = true
  }
}

function unselectAll() {
  for (const taxon of taxaStore.taxa) {
    taxon.selected = false
  }
}

// Step navigation
function moveToStep(step: string) {
  if (step === 'step-1') {
    currentStep.value = 1
    validationError.value = null
    // Don't clear pbdbResults - users should be able to go back and keep their validation results
  } else if (step === 'step-2') {
    currentStep.value = 2
  }
}

function startOver() {
  // Clear preselected taxa state FIRST to ensure filteredTaxa updates correctly
  hasPreselectedTaxa.value = false
  preselectedTaxaIds.value = []
  
  // Then reset everything else
  currentStep.value = 1
  pbdbResults.value.clear()
  selectedImports.value.clear()
  validationError.value = null
  failedTaxaIds.value = []
  selectedTaxaSize.value = 0
  
  // Clear all taxa selections
  for (const taxon of taxaStore.taxa) {
    taxon.selected = false
  }
}

// Validation functions
async function validateSelectedTaxa() {
  const selectedTaxa = filteredTaxa.value.filter(t => t.selected)
  selectedTaxaSize.value = selectedTaxa.length
  
  if (selectedTaxa.length === 0) {
    alert('Please select at least one taxon to validate.')
    return
  }

  if (selectedTaxa.length > maxSelectedTaxa) {
    alert(`You can only validate up to ${maxSelectedTaxa} taxa at a time.`)
    return
  }

  isValidating.value = true
  validationError.value = null
  failedTaxaIds.value = []
  
  try {
    const selectedTaxaIds = selectedTaxa.map(t => t.taxon_id)

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/pbdb/validate`,
      { taxon_ids: selectedTaxaIds }
    )

    if (response.status !== 200) {
      throw new Error('Failed to validate taxa against PBDB')
    }

    const data = response.data
    if (!data.success) {
      console.error('[PBDB FRONTEND DEBUG] Validation failed:', data)
      throw new Error(data.message || 'Validation failed')
    }

    // Process validation results
    pbdbResults.value.clear()
    
    for (const [taxonIdStr, result] of Object.entries(data.taxa_info as Record<string, PbdbValidationResult>)) {
      const taxonId = parseInt(taxonIdStr)
      pbdbResults.value.set(taxonId, result as PbdbValidationResult)
    }
    
    currentStep.value = 2 // Go to results step
  } catch (error) {
    validationError.value = error instanceof Error ? error.message : 'An error occurred'
  } finally {
    isValidating.value = false
  }
}

// Import functions
const selectedImports = ref<Map<number, PbdbImportData>>(new Map())

function selectAllForImport() {
  selectedImports.value.clear()
  for (const taxon of taxaWithPbdbData.value) {
    const pbdbData = getPbdbDataForTaxon(taxon.taxon_id)
    if (pbdbData && pbdbData.id) {
      selectedImports.value.set(taxon.taxon_id, {
        taxon_id: taxon.taxon_id,
        id: pbdbData.id,
        ranks: pbdbData.ranks
      })
    }
  }
}

function deselectAllForImport() {
  selectedImports.value.clear()
}

function toggleImportSelection(taxonId: number, pbdbData: any) {
  
  if (selectedImports.value.has(taxonId)) {
    selectedImports.value.delete(taxonId)
    console.log(`[DEBUG] Removed taxon ${taxonId}, new size:`, selectedImports.value.size)
  } else {
    if (pbdbData && pbdbData.id) {
      selectedImports.value.set(taxonId, {
        taxon_id: taxonId,
        id: pbdbData.id,
        ranks: pbdbData.ranks
      })
      console.log(`[DEBUG] Added taxon ${taxonId}, new size:`, selectedImports.value.size)
    } else {
      console.log(`[DEBUG] Cannot add taxon ${taxonId} - missing pbdbData:`, pbdbData)
    }
  }
}

function getPbdbDataForTaxon(taxonId: number) {
  // First check current session results
  const currentSessionResult = pbdbResults.value.get(taxonId)
  if (currentSessionResult && currentSessionResult.pbdb) {
    return currentSessionResult.pbdb
  }
  
  // If not, they won't have selectable PBDB data until revalidation happens
  const validationResult = validationResults.value.get(taxonId)
  if (validationResult && validationResult.pbdb_pulled_on && validationResult.pbdb_taxon_id === null) {
    // If not, return null so checkbox is disabled
    return null
  }
  
  return null
}

async function importSelectedData() {
  if (selectedImports.value?.size === 0) {
    alert('Please select at least one taxon to import data for.')
    return
  }

  isImporting.value = true
  
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/pbdb/import`,
      { taxa_info: Array.from(selectedImports.value.values()) }
    )

    if (response.status !== 200) {
      throw new Error('Failed to import PBDB data')
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Import failed')
    }

    const importedCount = selectedImports.value.size
    const importedTaxaIds = Array.from(selectedImports.value.keys())
    
    // Clear import selections but keep validation results for non-imported taxa
    selectedImports.value.clear()
    
    // Remove imported taxa from current session results (they'll show as imported after refresh)
    for (const taxonId of importedTaxaIds) {
      pbdbResults.value.delete(taxonId)
    }
    
    // Go back to Step 1 and clear taxa selections
    currentStep.value = 1
    for (const taxon of taxaStore.taxa) {
      taxon.selected = false
    }
    
    // Refresh validation results to show updated status
    await loadPbdbValidationStatus()

    alert(`Successfully imported PBDB taxonomic data for ${importedCount} taxa!`)
    
    // Refresh taxa store to show updated data
    taxaStore.fetch(projectId)
  } catch (error) {
    console.error('Error importing PBDB data:', error)
    alert('Failed to import PBDB data. Please try again.')
  } finally {
    isImporting.value = false
  }
}

function getTimestampInfo(taxon: any) {
  const validationResult = validationResults.value.get(taxon.taxon_id)
  const currentSessionResult = pbdbResults.value.get(taxon.taxon_id)
  
  const pulledTimestamp = validationResult?.pbdb_pulled_on
  const pbdbTaxonId = validationResult?.pbdb_taxon_id

  // Priority 1: Check if actually imported (has pbdb_taxon_id > 0)
  // Handle both number and string types from database
  const taxonIdNum = typeof pbdbTaxonId === 'string' ? parseInt(pbdbTaxonId) : pbdbTaxonId
  if (taxonIdNum && taxonIdNum > 0) {
    return {
      type: 'imported',
      timestamp: pulledTimestamp,
      label: 'PBDB data imported',
      class: 'text-success'
    }
  }
  
  // Priority 2: Check if current session has PBDB data (validated but not imported)
  if (currentSessionResult && currentSessionResult.pbdb) {
    return {
      type: 'validated_not_imported',
      timestamp: pulledTimestamp || Date.now(),
      label: 'PBDB data found (not imported)',
      class: 'text-warning'
    }
  }
  
  // Priority 3: Check for "found but not imported" state (pbdb_pulled_on set, pbdb_taxon_id = null)
  if (pulledTimestamp && (pbdbTaxonId === null || pbdbTaxonId === undefined)) {
    return {
      type: 'validated_not_imported',
      timestamp: pulledTimestamp,
      label: 'PBDB data found (not imported)',
      class: 'text-warning'
    }
  }
  
  // Priority 4: Check for "no results" state (pbdb_pulled_on set, pbdb_taxon_id = 0)
  if (pulledTimestamp && (pbdbTaxonId === 0 || pbdbTaxonId === '0')) {
    return {
      type: 'no_results',
      timestamp: pulledTimestamp,
      label: 'No PBDB results',
      class: 'text-danger'
    }
  }
  
  // Priority 5: Previously searched (generic - shouldn't happen with new logic)
  if (pulledTimestamp) {
    return {
      type: 'pulled',
      timestamp: pulledTimestamp,
      label: 'Last searched',
      class: 'text-info'
    }
  }
  
  return null
}

function formatRanksForDisplay(ranks: Record<string, string>): string {
  const displayRanks = Object.entries(ranks)
    .map(([key, value]) => {
      const displayName = key.replace('higher_taxon_', '').replace(/_/g, ' ')
      const capitalizedDisplayName = capitalizeFirstLetter(displayName)
      return `${capitalizedDisplayName}: ${value}`
    })
    .join(', ')
  return displayRanks
}

async function loadPbdbValidationStatus() {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/pbdb`
    )

    validationResults.value.clear()
    for (const result of response.data.results) {
      const taxonId = parseInt(result.taxon_id)
      validationResults.value.set(taxonId, result)
    }
  } catch (error) {
    console.error('Error loading PBDB validation status:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data'
    })
  }
}

async function retryFailedTaxa() {
  if (failedTaxaIds.value.length === 0) return
  
  // Temporarily select only the failed taxa
  for (const taxon of taxaStore.taxa) {
    taxon.selected = failedTaxaIds.value.includes(taxon.taxon_id)
  }
  
  failedTaxaIds.value = []
  await validateSelectedTaxa()
}

onMounted(async () => {
  if (!taxaStore.isLoaded) {
    await taxaStore.fetch(projectId)
  }

  // Load existing PBDB validation status
  await loadPbdbValidationStatus()

  // Check for preselected taxa from taxa list page
  const preselectedTaxa = sessionStorage.getItem('pbdb-preselected-taxa')
  if (preselectedTaxa) {
    try {
      const taxaIds = JSON.parse(preselectedTaxa)
      if (Array.isArray(taxaIds) && taxaIds.length > 0) {
        // Pre-select the taxa first (before setting preselected state)
        for (const taxon of taxaStore.taxa) {
          taxon.selected = taxaIds.includes(taxon.taxon_id)
        }
        
        // Set preselected taxa state after selection
        hasPreselectedTaxa.value = true
        preselectedTaxaIds.value = taxaIds
        sessionStorage.removeItem('pbdb-preselected-taxa')
        
        // Auto-advance to validation
        await validateSelectedTaxa()
      }
    } catch (error) {
      console.error('Error parsing preselected taxa:', error)
      sessionStorage.removeItem('pbdb-preselected-taxa')
    }
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
      <i class="fa-solid fa-chevron-left"></i>
      <RouterLink
        :to="`/myprojects/${projectId}/taxa/`"
        class="nav-link m-0 p-0 pl-1"
      >
        Back to Taxa
      </RouterLink>
    </div>
    
    <div v-if="taxaStore.taxa.length == 0">Your project has no taxa</div>
    <div class="stepwizard" v-else>
      <div class="import-step-row setup-panel">
        <hr />
        <div class="import-step">
          <a 
            href="#step-1" 
            type="button" 
            :class="['btn', 'btn-circle', currentStep === 1 ? 'btn-primary' : 'btn-default']"
            @click="moveToStep('step-1')"
          >
            1
          </a>
          <p>Select</p>
        </div>
        <div class="import-step">
          <a
            href="#step-2"
            type="button"
            :class="['btn', 'btn-circle', currentStep === 2 ? 'btn-primary' : (pbdbResults.size > 0 ? 'btn-success' : 'btn-default')]"
            :disabled="pbdbResults.size === 0"
            @click="pbdbResults.size > 0 ? moveToStep('step-2') : null"
          >
            2
          </a>
          <p>Import</p>
        </div>
      </div>
      
      <div>
        <form>
          <!-- Step 1: Taxa Selection -->
          <div v-if="currentStep === 1" class="row setup-content" id="step-1">
            <span>Select Taxa for PBDB Validation</span>
            
            <div v-if="hasPreselectedTaxa" class="alert alert-info my-3">
              <i class="fa fa-info-circle me-2"></i>
              Showing {{ preselectedTaxaIds.length }} preselected taxa from the taxa list.
              <button type="button" class="btn btn-sm btn-outline-primary ms-2" @click="hasPreselectedTaxa = false; preselectedTaxaIds = []">
                Show all taxa
              </button>
            </div>
            
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
                    content="Use this to search PBDB again since their database is constantly being updated (Only first 100 will be selected)"
                  >
                  </Tooltip>
                </button>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="unselectAll">Unselect all</button>
              </div>
            </div>
            
            <p class="mb-3">
              Use the checkboxes to indicate which taxa you would like to validate
              against the <strong>Paleobiology Database (PBDB)</strong>. You will be presented with
              higher taxonomic rank data to selectively import and update your taxa.
            </p>
            
            <p class="mb-3">
              <i>
                Taxa for which data have already been imported from PBDB will appear with 
                a green "PBDB data imported" indicator. Taxa with no PBDB results will appear with 
                a red "No PBDB results" indicator.
              </i>
            </p>

            <div v-if="isValidating" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3">Validating taxa against PBDB...</p>
            </div>

            <div v-else-if="validationError" class="alert alert-danger">
              <h5>Validation Error</h5>
              <p>{{ validationError }}</p>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-danger" @click="validateSelectedTaxa">
                  Try Again
                </button>
                <button 
                  v-if="failedTaxaIds.length > 0"
                  type="button" 
                  class="btn btn-danger btn-sm"
                  @click="retryFailedTaxa()"
                  :disabled="isValidating"
                >
                  <span v-if="isValidating">
                    <i class="fa fa-spinner fa-spin me-1"></i>
                    Retrying...
                  </span>
                  <span v-else>
                    <i class="fa-solid fa-refresh me-1"></i>
                    Retry Failed Taxa ({{ failedTaxaIds.length }})
                  </span>
                </button>
              </div>
            </div>

            <div v-else class="grid">
              <div
                v-for="taxon in filteredTaxa"
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
                          greyed: getTimestampInfo(taxon)?.type === 'imported'
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
                  </div>
                </label>
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
                @click="validateSelectedTaxa"
                :disabled="isValidating"
              >
                <span v-if="isValidating">
                  <i class="fa fa-spinner fa-spin me-1"></i>
                  Validating...
                </span>
                <span v-else>
                  <i class="fa fa-search me-1"></i>
                  Validate Against PBDB
                </span>
              </button>
            </div>
          </div>

          <!-- Step 2: Results and Import -->
          <div v-if="currentStep === 2" class="row setup-content" id="step-2">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4>PBDB Validation Results</h4>
              <div>
                <span v-if="taxaWithPbdbData.length > 0" class="badge bg-success me-2">
                  <i class="fa fa-check-circle me-1"></i>
                  {{ taxaWithPbdbData.length }} taxa found
                </span>
                <span v-if="taxaWithoutPbdbData.length > 0" class="badge bg-danger me-2">
                  <i class="fa fa-exclamation-triangle me-1"></i>
                  {{ taxaWithoutPbdbData.length }} no results
                </span>
                <span class="badge bg-secondary">
                  <i class="fa fa-list me-1"></i>
                  {{ selectedTaxaSize }} selected for import
                </span>
              </div>
            </div>



            <div v-if="taxaWithoutPbdbData.length > 0" class="mb-4">
              <h5 class="text-danger">
                <i class="fa fa-exclamation-triangle me-2"></i>
                Taxa with No PBDB Data ({{ taxaWithoutPbdbData.length }})
              </h5>
              <div class="alert alert-warning">
                <p class="mb-2">The following taxa were not found in the PBDB:</p>
                <div class="d-flex flex-wrap gap-2">
                  <span 
                    v-for="taxon in taxaWithoutPbdbData" 
                    :key="taxon.taxon_id"
                    class="badge bg-warning text-dark"
                  >
                    <TaxonomicName
                      :showExtinctMarker="true"
                      :taxon="taxon"
                    />
                  </span>
                </div>
              </div>
            </div>

            <div v-if="taxaWithPbdbData.length > 0">
              <h5 class="text-success mb-3">
                <i class="fa fa-download me-2"></i>
                Taxa with PBDB Data ({{ taxaWithPbdbData.length }})
              </h5>
              
              <div v-if="currentSessionPreviouslyImported.length > 0" class="alert alert-info mb-3">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Note:</strong> {{ currentSessionPreviouslyImported.length }} of these taxa already have imported PBDB data. 
                Importing again will override the previous data with fresh results from PBDB.
              </div>
              
              <div class="d-flex gap-2 mb-3">
                <button type="button" class="btn btn-outline-primary btn-sm" @click="selectAllForImport">
                  <i class="fa fa-check me-1"></i>
                  <span>Select all for import</span>
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="deselectAllForImport">
                  <i class="fa fa-times me-1"></i>
                  <span>Deselect all</span>
                </button>
              </div>

              <div class="d-flex flex-column gap-3">
                <div
                  v-for="taxon in taxaWithPbdbData"
                  :key="taxon.taxon_id"
                  class="card"
                >
                  <div class="card-body">
                    <div class="form-check">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="`import-${taxon.taxon_id}`"
                        :checked="selectedImports.has(taxon.taxon_id)"
                        @change="toggleImportSelection(taxon.taxon_id, getPbdbDataForTaxon(taxon.taxon_id))"
                      />
                      <label class="form-check-label w-100" :for="`import-${taxon.taxon_id}`">
                        <div class="d-flex justify-content-between align-items-start">
                          <div class="flex-grow-1">
                            <h6 class="mb-1">
                              <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
                              <span v-if="currentSessionPreviouslyImported.some(t => t.taxon_id === taxon.taxon_id)" class="badge bg-warning text-dark ms-2">
                                Re-import
                              </span>
                            </h6>
                            <div class="text-muted small mb-1">
                              <strong>PBDB ID:</strong> {{ getPbdbDataForTaxon(taxon.taxon_id)?.id }}
                            </div>
                            <div class="text-muted small">
                              <strong>Higher ranks to import:</strong> 
                              {{ formatRanksForDisplay(getPbdbDataForTaxon(taxon.taxon_id)?.ranks || {}) }}
                            </div>
                          </div>
                          <div class="ms-3">
                            <a 
                              :href="`https://paleobiodb.org/classic/basicTaxonInfo?taxon_no=${getPbdbDataForTaxon(taxon.taxon_id)?.id}`"
                              target="_blank"
                              class="btn btn-sm btn-outline-primary"
                              @click.stop
                            >
                              <i class="fa fa-external-link"></i>
                              View in PBDB
                            </a>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="btn-step-group mt-4">
              <button
                type="button"
                class="btn btn-outline-primary btn-step-prev"
                @click="moveToStep('step-1')"
              >
                <i class="fa-solid fa-arrow-left me-1"></i>
                Back to Selection
              </button>
              <div class="d-flex gap-2">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="startOver"
                >
                  <i class="fa-solid fa-refresh me-1"></i>
                  Start Over
                </button>
                <button
                  type="button"
                  class="btn btn-success btn-step-next"
                  @click="importSelectedData"
                  :disabled="selectedImports.value?.size === 0 || isImporting"
                >
                  <span v-if="isImporting">
                    <i class="fa fa-spinner fa-spin me-1"></i>
                    Importing...
                  </span>
                  <span v-else>
                    <i class="fa fa-download me-1"></i>
                    Import {{ selectedImports.value?.size }} Taxa
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/steps.css';

.setup-content {
  display: block;
}

/* Override the shared steps.css which hides step-2 by default since we use v-if for visibility */
#step-2 {
  display: block !important;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
}

.grid-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  background-color: #fff;
}

.grid-item:hover {
  background-color: #f8f9fa;
}

.grid-item-name {
  flex: 1;
  margin: 0;
  cursor: pointer;
}

.taxon-info-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.taxon-name-container {
  font-weight: 500;
}

.timestamp-info {
  font-size: 0.875rem;
}

.greyed {
  color: #6c757d !important;
  opacity: 0.7;
}

.btn-step-group {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.btn-step-prev,
.btn-step-next {
  min-width: 150px;
}
</style>