<script setup>
import axios from 'axios'
import { ref } from 'vue'

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  matrixId: {
    type: String,
    required: true,
  },
})

// TNT specific variables
const tntFile = ref(null)
const tntUploadErrors = ref({})
const isUploadingTnt = ref(false)
const tntOutgroup = ref('Akromystax')
const tntHoldValue = ref('1000')
const tntAnalysisResults = ref(null)
const showTntResults = ref(false)
const sessionResults = ref([]) // Store all session results

// Species extraction variables
const availableSpecies = ref([])
const isExtractingSpecies = ref(false)
const speciesExtractionError = ref('')

// TNT validation variables
const isValidatingTnt = ref(false)
const tntValidationError = ref('')
const tntValidationStatus = ref(null) // null, 'valid', 'invalid'

// Matrix-based analysis variables
const isValidatingMatrix = ref(false)
const matrixValidationError = ref('')
const matrixValidationStatus = ref(null) // null, 'valid', 'invalid'
const matrixCacheKey = ref('')
const matrixSpecies = ref([])
const isAnalyzingMatrix = ref(false)

// TNT search type variables
const searchType = ref('implicit') // 'implicit', 'traditional', 'new_technology'
const searchValidationError = ref('')

// Traditional search parameters
const traditionalReplications = ref(10)
const traditionalTreesPerReplication = ref(1)
const traditionalSwapAlgorithm = ref('tbr') // tbr, spr, nni

// New technology search parameters
const newtechIterations = ref(10)
const newtechSectorial = ref(true)
const newtechRatchet = ref(true)
const newtechDrift = ref(true)
const newtechFusing = ref(true)

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Validates a TNT file using the server validation endpoint
 * @param {File} file - The TNT file to validate
 * @returns {Promise<Object>} - Validation response data
 */
const baseUrl = import.meta.env.VITE_API_URL
async function apiValidateTntFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(`${baseUrl}/tnt/validate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Extracts species names from a TNT file
 * @param {File} file - The TNT file to extract species from
 * @returns {Promise<Object>} - Species extraction response data
 */
async function apiExtractSpeciesFromFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(`${baseUrl}/tnt/species`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Analyzes a TNT file with specified parameters
 * @param {File} file - The TNT file to analyze
 * @param {Object} params - Analysis parameters
 * @returns {Promise<Object>} - Analysis response data
 */
async function apiAnalyzeTntFile(file, params) {
  const formData = new FormData()

  // Append the uploaded TNT file directly
  formData.append('file', file)

  // Add other parameters from the form
  formData.append('outgroup', params.outgroup)
  formData.append('hold_value', params.holdValue)
  formData.append('search_type', params.searchType)

  // Add search-specific parameters
  if (params.searchType === 'traditional') {
    formData.append('replications', params.replications)
    formData.append('trees_per_replication', params.treesPerReplication)
  } else if (params.searchType === 'new_technology') {
    formData.append('iterations', params.iterations)
  }

  const response = await axios.post(`${baseUrl}/tnt/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Validates a matrix for TNT conversion and gets species + cache key
 * @param {string} matrixId - The matrix ID to validate
 * @returns {Promise<Object>} - Validation response data with species and cache key
 */
async function apiValidateMatrix(matrixId) {
  const response = await axios.post(
    `${baseUrl}/tnt/matrices/${matrixId}/validate`
  )
  return response.data
}

/**
 * Analyzes a matrix using cached TNT content
 * @param {string} cacheKey - The cache key from matrix validation
 * @param {Object} params - Analysis parameters
 * @returns {Promise<string>} - Analysis results
 */
async function apiAnalyzeCachedMatrix(cacheKey, params) {
  const response = await axios.post(
    `${baseUrl}/tnt/cached/${cacheKey}/analyze`,
    {
      outgroup: params.outgroup,
      hold_value: params.holdValue,
      search_type: params.searchType,
      replications: params.replications,
      trees_per_replication: params.treesPerReplication,
      iterations: params.iterations,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data
}

// =============================================================================
// BUSINESS LOGIC FUNCTIONS
// =============================================================================

// TNT file upload handling functions
async function handleTntFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    const validExtensions = ['.tnt', '.txt']
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(fileExtension)) {
      tntUploadErrors.value.general =
        'Please select a valid TNT file (.tnt or .txt)'
      tntFile.value = null
      return
    }

    // Clear any previous errors
    tntUploadErrors.value = {}
    speciesExtractionError.value = ''
    tntFile.value = file
    console.log('TNT file selected:', file.name, file.size, 'bytes')

    // First validate the TNT file
    await validateTntFile(file)

    // Only extract species if validation passed
    if (tntValidationStatus.value === 'valid') {
      await extractSpeciesFromFile(file)
    }
  }
}

// Function to validate TNT file
async function validateTntFile(file) {
  try {
    isValidatingTnt.value = true
    tntValidationError.value = ''
    tntValidationStatus.value = null

    const responseData = await apiValidateTntFile(file)

    if (responseData) {
      if (responseData.valid) {
        tntValidationStatus.value = 'valid'
        console.log('TNT file validation passed')
      } else {
        tntValidationStatus.value = 'invalid'
        tntValidationError.value = 'TNT file validation failed'
        console.log('TNT file validation failed:', responseData.issues)
      }
    }
  } catch (error) {
    console.error('Error validating TNT file:', error)
    tntValidationStatus.value = 'invalid'
    tntValidationError.value = 'Failed to validate TNT file'
  } finally {
    isValidatingTnt.value = false
  }
}

// Function to extract species names from TNT file
async function extractSpeciesFromFile(file) {
  try {
    isExtractingSpecies.value = true
    speciesExtractionError.value = ''

    const responseData = await apiExtractSpeciesFromFile(file)

    if (responseData && responseData.species_names) {
      availableSpecies.value = responseData.species_names

      // Set suggested outgroup if available
      if (responseData.suggested_outgroup) {
        tntOutgroup.value = responseData.suggested_outgroup
      }

      console.log(
        `Extracted ${responseData.species_count} species from TNT file`
      )
    }
  } catch (error) {
    console.error('Error extracting species from TNT file:', error)
    speciesExtractionError.value =
      'Failed to extract species names from the file'
    // Keep the default outgroup value if extraction fails
  } finally {
    isExtractingSpecies.value = false
  }
}

// Function to validate matrix for TNT conversion
async function validateMatrix() {
  try {
    isValidatingMatrix.value = true
    matrixValidationError.value = ''
    matrixValidationStatus.value = null
    matrixCacheKey.value = ''
    matrixSpecies.value = []

    const responseData = await apiValidateMatrix(props.matrixId)

    if (responseData) {
      if (responseData.valid) {
        matrixValidationStatus.value = 'valid'
        matrixCacheKey.value = responseData.cacheKey
        matrixSpecies.value = responseData.species || []

        // Set available species for outgroup selection
        availableSpecies.value = matrixSpecies.value

        // Set suggested outgroup if available
        if (matrixSpecies.value.length > 0) {
          tntOutgroup.value = matrixSpecies.value[0]
        }

        // Auto-switch from implicit search if too many taxa
        if (
          searchType.value === 'implicit' &&
          matrixSpecies.value.length > 30
        ) {
          searchType.value = 'traditional'
          console.log(
            `Auto-switched to traditional search due to ${matrixSpecies.value.length} taxa`
          )
        }

        console.log(
          'Matrix validation passed, cache key:',
          matrixCacheKey.value
        )
        console.log('Found species:', matrixSpecies.value.length)
      } else {
        matrixValidationStatus.value = 'invalid'
        matrixValidationError.value =
          responseData.error || 'Matrix validation failed'
        console.log('Matrix validation failed:', responseData.error)
      }
    }
  } catch (error) {
    console.error('Error validating matrix:', error)
    matrixValidationStatus.value = 'invalid'
    matrixValidationError.value = 'Failed to validate matrix for TNT conversion'
  } finally {
    isValidatingMatrix.value = false
  }
}

// Function to re-validate matrix (useful when cache expires)
async function revalidateMatrix() {
  // Reset validation status and re-run validation
  matrixValidationStatus.value = null
  matrixCacheKey.value = ''
  matrixSpecies.value = []
  availableSpecies.value = []
  await validateMatrix()
}

function resetTntUpload() {
  tntFile.value = null
  tntUploadErrors.value = {}
  tntOutgroup.value = 'Akromystax'
  tntHoldValue.value = '1000'
  tntAnalysisResults.value = null
  showTntResults.value = false

  // Clear species extraction data
  availableSpecies.value = []
  speciesExtractionError.value = ''

  // Clear validation data
  tntValidationError.value = ''
  tntValidationStatus.value = null

  // Clear matrix validation data
  matrixValidationError.value = ''
  matrixValidationStatus.value = null
  matrixCacheKey.value = ''
  matrixSpecies.value = []

  // Reset search parameters
  searchType.value = 'implicit'
  searchValidationError.value = ''
  traditionalReplications.value = 10
  traditionalTreesPerReplication.value = 1
  traditionalSwapAlgorithm.value = 'tbr'
  newtechIterations.value = 10
  newtechSectorial.value = true
  newtechRatchet.value = true
  newtechDrift.value = true
  newtechFusing.value = true

  // Clear file input
  const fileInput = document.getElementById('tnt-file-upload')
  if (fileInput) {
    fileInput.value = ''
  }

  // Note: sessionResults are preserved across resets to maintain session history
}

// Function to download a specific result file
function downloadResultFile(resultItem) {
  const nexusContent = resultItem.nex_content
  if (nexusContent) {
    downloadNexusFile(nexusContent, resultItem.filename)
  } else {
    console.log('No nex_content found')
  }
}

// Download helper functions for TNT analysis results
function downloadNexusFile(content, filename) {
  try {
    // Create a Blob with the file content
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    // Create a temporary link element and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    URL.revokeObjectURL(url)

    console.log(`Downloaded: ${filename}`)
  } catch (error) {
    console.error('Error downloading nexus file:', error)
    alert('Failed to download the analysis results file.')
  }
}

// Function to validate search type based on number of taxa
function validateSearchType() {
  searchValidationError.value = ''

  // For implicit enumeration, check if taxa count > 30
  // Note: This should rarely trigger now since we disable the option in UI
  if (searchType.value === 'implicit' && availableSpecies.value.length > 30) {
    searchValidationError.value =
      'Implicit enumeration can only be used for matrices with up to 30 taxa. Your matrix has ' +
      availableSpecies.value.length +
      ' taxa. Please select Traditional or New Technology search.'
    return false
  }

  return true
}

// Function to run matrix-based TNT analysis
async function onRunMatrixTnt() {
  try {
    // Check if matrix validation passed
    if (matrixValidationStatus.value !== 'valid' || !matrixCacheKey.value) {
      matrixValidationError.value =
        'Please validate the matrix first before running analysis'
      return
    }

    // Clear previous errors before validation
    tntUploadErrors.value = {}

    // Validate search type
    if (!validateSearchType()) {
      return
    }

    isAnalyzingMatrix.value = true

    // Prepare analysis parameters
    const analysisParams = {
      outgroup: tntOutgroup.value,
      holdValue: tntHoldValue.value,
      searchType: searchType.value,
    }

    // Add search-specific parameters
    if (searchType.value === 'traditional') {
      analysisParams.replications = traditionalReplications.value
      analysisParams.treesPerReplication = traditionalTreesPerReplication.value
      analysisParams.swapAlgorithm = traditionalSwapAlgorithm.value
    } else if (searchType.value === 'new_technology') {
      analysisParams.iterations = newtechIterations.value
    }

    console.log(
      'Submitting matrix TNT analysis with cache key:',
      matrixCacheKey.value
    )

    // Make API call to analyze cached matrix
    const responseData = await apiAnalyzeCachedMatrix(
      matrixCacheKey.value,
      analysisParams
    )

    // Process the response data
    if (responseData) {
      // Create result entry for session list
      const timestamp = Date.now()
      const resultEntry = {
        id: timestamp,
        filename: `matrix_${props.matrixId}_analysis_${timestamp}.nex`,
        originalFile: `Matrix ${props.matrixId}`,
        timestamp: new Date().toLocaleString(),
        outgroup: tntOutgroup.value,
        holdValue: tntHoldValue.value,
        status: 'completed',
        nex_content: responseData,
        analysisParams: { ...analysisParams }, // Store complete analysis parameters
      }

      // Add to session results
      sessionResults.value.unshift(resultEntry) // Add to beginning of array

      downloadNexusFile(resultEntry.nex_content, resultEntry.filename)

      // Store current results for compatibility
      tntAnalysisResults.value = responseData
      showTntResults.value = true
    }
  } catch (error) {
    console.error('Error running matrix TNT analysis:', error)

    // Check if it's a cache expiration error
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage = error.response.data.error
      if (
        errorMessage.includes('TNT content not found in cache') ||
        errorMessage.includes('expired')
      ) {
        matrixValidationError.value =
          'TNT content has expired. Please re-validate the matrix.'
        // Reset validation status to allow re-validation
        matrixValidationStatus.value = 'invalid'
        matrixCacheKey.value = ''
        return
      }
    }

    tntUploadErrors.value.general =
      'Failed to submit matrix TNT analysis. Please try again.'
  } finally {
    isAnalyzingMatrix.value = false
  }
}

async function onRunTnt() {
  try {
    // Check if a TNT file has been uploaded
    if (!tntFile.value) {
      tntUploadErrors.value.general = 'Please select a TNT file to upload'
      return
    }

    // Check if file validation passed
    if (tntValidationStatus.value !== 'valid') {
      tntUploadErrors.value.general =
        'Please upload a valid TNT file before running analysis'
      return
    }

    // Clear previous errors before validation
    tntUploadErrors.value = {}

    // Validate search type
    if (!validateSearchType()) {
      return
    }

    isUploadingTnt.value = true

    // Prepare analysis parameters
    const analysisParams = {
      outgroup: tntOutgroup.value,
      holdValue: tntHoldValue.value,
      searchType: searchType.value,
    }

    // Add search-specific parameters
    if (searchType.value === 'traditional') {
      analysisParams.replications = traditionalReplications.value
      analysisParams.treesPerReplication = traditionalTreesPerReplication.value
      analysisParams.swapAlgorithm = traditionalSwapAlgorithm.value
    } else if (searchType.value === 'new_technology') {
      analysisParams.iterations = newtechIterations.value
    }

    console.log('Submitting TNT file:', tntFile.value.name)

    // Make API call to analyze TNT file
    const responseData = await apiAnalyzeTntFile(tntFile.value, analysisParams)

    console.log('TNT analysis submitted:', responseData)

    // Process the response data
    if (responseData) {
      console.log('TNT analysis results:', responseData)

      // Create result entry for session list
      const timestamp = Date.now()
      const resultEntry = {
        id: timestamp,
        filename: `${tntFile.value.name.replace(
          /\.[^/.]+$/,
          ''
        )}_analysis_${timestamp}.nex`,
        originalFile: tntFile.value.name,
        timestamp: new Date().toLocaleString(),
        outgroup: tntOutgroup.value,
        holdValue: tntHoldValue.value,
        status: 'completed',
        nex_content: responseData,
        analysisParams: { ...analysisParams }, // Store complete analysis parameters
      }

      // Add to session results
      sessionResults.value.unshift(resultEntry) // Add to beginning of array

      downloadNexusFile(resultEntry.nex_content, resultEntry.filename)

      // Store current results for compatibility
      tntAnalysisResults.value = responseData
      showTntResults.value = true
    }
  } catch (error) {
    console.error('Error running TNT analysis:', error)
    tntUploadErrors.value.general =
      'Failed to submit TNT analysis. Please try again.'
  } finally {
    isUploadingTnt.value = false
  }
}

// Function to format analysis parameters for display
function formatAnalysisParameters(params) {
  if (!params) return 'No parameters available'

  const formattedParams = []

  // Base parameters
  formattedParams.push(`Search Type: ${params.searchType}`)
  formattedParams.push(`Outgroup: ${params.outgroup}`)
  formattedParams.push(`Hold Value: ${params.holdValue}`)

  // Search-specific parameters
  if (params.searchType === 'traditional') {
    if (params.replications)
      formattedParams.push(`Replications: ${params.replications}`)
    if (params.treesPerReplication)
      formattedParams.push(
        `Trees per Replication: ${params.treesPerReplication}`
      )
    if (params.swapAlgorithm)
      formattedParams.push(`Swap Algorithm: ${params.swapAlgorithm}`)
  } else if (params.searchType === 'new_technology') {
    if (params.iterations)
      formattedParams.push(`Iterations: ${params.iterations}`)
  }

  return formattedParams.join(', ')
}
</script>

<template>
  <div class="tnt-analysis-container">
    <h6>TNT (Tree analysis using New Technology) Analysis</h6>
    <p>
      Please try this BETA tool and send any feedback to
      <router-link to="/askus">Contact Support</router-link>
    </p>

    <!-- Error Messages -->
    <div v-if="tntUploadErrors.general" class="alert alert-danger mb-3">
      {{ tntUploadErrors.general }}
    </div>

    <!-- Species Extraction Error -->
    <div v-if="speciesExtractionError" class="alert alert-warning mb-3">
      {{ speciesExtractionError }}
    </div>

    <!-- Matrix Validation Error -->
    <div v-if="matrixValidationError" class="alert alert-danger mb-3">
      {{ matrixValidationError }}
    </div>

    <!-- TNT Validation Error -->
    <div v-if="tntValidationError" class="alert alert-danger mb-3">
      {{ tntValidationError }}
    </div>

    <!-- Search Type Validation Error -->
    <div v-if="searchValidationError" class="alert alert-danger mb-3">
      {{ searchValidationError }}
    </div>

    <div class="tab-content">
      <div class="tnt-file-section">
        <div class="alert alert-secondary mb-3">
          <strong>Note</strong> – Analyze your matrix using TNT (Tree analysis
          using New Technology) for phylogenetic analysis. This tool converts
          your matrix to TNT format and provides direct access to TNT algorithms
          for tree building and analysis.
        </div>

        <!-- Matrix validation section -->
        <div class="form-row mb-3">
          <div class="col-md-9">
            <label class="form-label">Matrix Analysis</label>
            <div class="matrix-info">
              <p class="mb-2"><strong>Matrix ID:</strong> {{ matrixId }}</p>

              <!-- Matrix validation loading -->
              <div v-if="isValidatingMatrix" class="mt-1">
                <small class="text-info">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Validating matrix for TNT conversion...
                </small>
              </div>

              <!-- Matrix validation status -->
              <div v-else-if="matrixValidationStatus" class="mt-1">
                <small
                  v-if="matrixValidationStatus === 'valid'"
                  class="text-success"
                >
                  <i class="fa-solid fa-check-circle"></i>
                  Matrix validation passed - Found
                  {{ matrixSpecies.length }} species
                </small>
                <small
                  v-else-if="matrixValidationStatus === 'invalid'"
                  class="text-danger"
                >
                  <i class="fa-solid fa-times-circle"></i>
                  Matrix validation failed
                </small>
              </div>
            </div>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button
              v-if="matrixValidationStatus !== 'valid'"
              type="button"
              class="btn btn-outline-primary"
              @click="validateMatrix"
              :disabled="isValidatingMatrix"
            >
              <span
                v-if="isValidatingMatrix"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isValidatingMatrix ? 'Validating...' : 'Validate Matrix' }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn-outline-secondary btn-sm"
              @click="revalidateMatrix"
              title="Re-validate matrix (useful if cache expires)"
            >
              <i class="fa-solid fa-refresh"></i> Re-validate
            </button>
          </div>
        </div>

        <!-- File upload section - COMMENTED OUT -->
        <!--
        <div class="form-row mb-3">
          <div class="col-md-12">
            <label class="form-label">TNT file to analyze</label>
            <input
              type="file"
              id="tnt-file-upload"
              class="form-control"
              accept=".tnt,.txt"
              @change="handleTntFileChange"
            />
            <div v-if="tntFile" class="mt-2">
              <small class="text-success">
                <i class="fa-solid fa-check-circle"></i>
                File selected: <strong>{{ tntFile.name }}</strong> ({{
                  Math.round(tntFile.size / 1024)
                }}
                KB)
              </small>

              <div v-if="isValidatingTnt" class="mt-1">
                <small class="text-info">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Validating TNT file...
                </small>
              </div>

              <div v-else-if="tntValidationStatus" class="mt-1">
                <small
                  v-if="tntValidationStatus === 'valid'"
                  class="text-success"
                >
                  <i class="fa-solid fa-check-circle"></i>
                  TNT file validation passed
                </small>
                <small
                  v-else-if="tntValidationStatus === 'invalid'"
                  class="text-danger"
                >
                  <i class="fa-solid fa-times-circle"></i>
                  TNT file validation failed
                </small>
              </div>

              <div v-if="isExtractingSpecies" class="mt-1">
                <small class="text-info">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Extracting species names...
                </small>
              </div>
              <div v-else-if="availableSpecies.length > 0" class="mt-1">
                <small class="text-info">
                  <i class="fa-solid fa-info-circle"></i>
                  Found {{ availableSpecies.length }} species in file
                </small>
              </div>
            </div>
          </div>
        </div>
        -->

        <!-- General parameters - only show after validation -->
        <div v-if="matrixValidationStatus === 'valid'" class="mb-4">
          <h6><strong>General parameters</strong></h6>
          <div class="form-row mb-3">
            <div class="col-md-6">
              <label class="form-label">Outgroup</label>
              <!-- Show dropdown if species are available, otherwise show text input -->
              <select
                v-if="availableSpecies.length > 0"
                v-model="tntOutgroup"
                class="form-select"
              >
                <option value="" disabled>Select an outgroup species</option>
                <option
                  v-for="species in availableSpecies"
                  :key="species"
                  :value="species"
                >
                  {{ species }}
                </option>
              </select>
              <input
                v-else
                type="text"
                v-model="tntOutgroup"
                class="form-control"
                placeholder="Enter outgroup name"
              />
              <!-- Helper text -->
              <small
                v-if="availableSpecies.length > 0"
                class="form-text text-muted"
              >
                Species extracted from your matrix. Select the appropriate
                outgroup for your analysis.
              </small>
              <small v-else class="form-text text-muted">
                Validate the matrix to automatically populate available species,
                or enter manually.
              </small>
            </div>
            <div class="col-md-6">
              <label class="form-label">
                Number of trees to hold in memory
                <small class="text-muted">(range: 100- 250,000)</small>
              </label>
              <input
                type="number"
                v-model="tntHoldValue"
                class="form-control"
                min="100"
                max="250000"
                placeholder="1000"
              />
            </div>
          </div>
        </div>

        <!-- Search Type Selection - only show after validation -->
        <div v-if="matrixValidationStatus === 'valid'" class="form-row mb-4">
          <div class="col-md-12">
            <label class="form-label">
              <strong>Search Type</strong>
              <i
                class="fa-solid fa-info-circle ms-1"
                title="Choose the appropriate search method based on your matrix size"
              ></i>
            </label>

            <div class="search-type-options">
              <!-- Implicit Enumeration -->
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="searchType"
                  id="searchImplicit"
                  value="implicit"
                  v-model="searchType"
                  @change="validateSearchType"
                  :disabled="availableSpecies.length > 30"
                />
                <label
                  class="form-check-label"
                  for="searchImplicit"
                  :class="{ 'text-muted': availableSpecies.length > 30 }"
                >
                  Implicit Enumeration (Exact Search, ≤30 taxa only)
                  <span v-if="availableSpecies.length > 30" class="text-danger">
                    - Disabled ({{ availableSpecies.length }} taxa)
                  </span>
                </label>
              </div>

              <!-- Traditional Search -->
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="searchType"
                  id="searchTraditional"
                  value="traditional"
                  v-model="searchType"
                  @change="validateSearchType"
                />
                <label class="form-check-label" for="searchTraditional">
                  Traditional Search (heuristic)
                </label>
              </div>

              <!-- New Technology Search -->
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="searchType"
                  id="searchNewtech"
                  value="new_technology"
                  v-model="searchType"
                  @change="validateSearchType"
                />
                <label class="form-check-label" for="searchNewtech">
                  New Technology (heuristic)
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Traditional Search Parameters - only show after validation -->
        <div
          v-if="
            matrixValidationStatus === 'valid' && searchType === 'traditional'
          "
          class="mb-4"
        >
          <div class="form-row">
            <div class="col-md-6">
              <label class="form-label">
                Number of replicates
                <small class="text-muted">(range: 1-100)</small>
              </label>
              <input
                type="number"
                v-model="traditionalReplications"
                class="form-control"
                min="1"
                max="100"
                placeholder="10"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">
                Number of trees to hold in memory per replicate
                <small class="text-muted">(range: 1-100)</small>
              </label>
              <input
                type="number"
                v-model="traditionalTreesPerReplication"
                class="form-control"
                min="1"
                max="100"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <!-- New Technology Search Parameters - only show after validation -->
        <div
          v-if="
            matrixValidationStatus === 'valid' &&
            searchType === 'new_technology'
          "
          class="mb-4"
        >
          <div class="form-row">
            <div class="col-md-6">
              <label class="form-label">
                Number of independent findings of the minimum length that will
                stop the search
                <small class="text-muted">(range: 5-50)</small>
              </label>
              <input
                type="number"
                v-model="newtechIterations"
                class="form-control"
                min="5"
                max="50"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <!-- Implicit Enumeration Info - only show after validation -->
        <div
          v-if="matrixValidationStatus === 'valid' && searchType === 'implicit'"
          class="search-info mb-4"
        >
          <div class="alert alert-info">
            <i class="fa-solid fa-lightbulb"></i>
            <strong>Implicit Enumeration</strong> will examine all possible
            trees and guarantee the most parsimonious solution. No additional
            parameters are needed - the command <code>ienum</code> will be
            executed automatically.
          </div>
        </div>

        <!-- Analysis Section - separate section that appears after validation -->
        <div v-if="matrixValidationStatus === 'valid'" class="analysis-section">
          <hr class="analysis-separator" />
          <h6 class="analysis-title">
            <i class="fa-solid fa-play-circle"></i> Run TNT Analysis
          </h6>

          <div class="form-row mb-3">
            <div class="col-md-9">
              <p class="analysis-description">
                Matrix validated successfully. Configure your analysis
                parameters above and click "Analyze Matrix" to run the TNT
                analysis.
              </p>
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button
                type="button"
                class="btn btn-primary"
                @click="onRunMatrixTnt"
                :disabled="isAnalyzingMatrix"
              >
                <span
                  v-if="isAnalyzingMatrix"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ isAnalyzingMatrix ? 'Analyzing...' : 'Analyze Matrix' }}
              </button>
            </div>
          </div>

          <div class="tab-content-buttons">
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="resetTntUpload"
              :disabled="isAnalyzingMatrix"
            >
              Reset
            </button>
          </div>
        </div>

        <div class="read-only">
          TNT (Tree analysis using New Technology) provides advanced
          phylogenetic analysis capabilities:
          <ul>
            <li>
              <strong>Implicit Enumeration:</strong> Guarantees finding the most
              parsimonious tree(s) for small datasets (≤30 taxa)
            </li>
            <li>
              <strong>Traditional Heuristic Search:</strong> Standard approach
              for larger datasets with customizable parameters
            </li>
            <li>
              <strong>New Technology Search:</strong>
            </li>
          </ul>
          Results are returned as NEXUS files containing the optimal tree(s) and
          analysis details.
        </div>
      </div>

      <hr class="bold_hr" />

      <!-- Session Results Section -->
      <div class="session-results-section mt-4">
        <h6>
          <i class="fa-solid fa-history"></i> Analysis Results ({{
            sessionResults.length
          }})
        </h6>

        <!-- No results message -->
        <div v-if="sessionResults.length === 0" class="no-results-message">
          <div class="alert alert-info">
            <i class="fa-solid fa-info-circle"></i>
            No analysis results yet. Validate your matrix and run analysis to
            see results here.
          </div>
        </div>

        <!-- Results list -->
        <div v-else class="results-list">
          <div
            v-for="result in sessionResults"
            :key="result.id"
            class="job-card"
          >
            <div class="job-header">
              <div class="job-info">
                <div class="job-title">
                  <strong>{{ result.originalFile }}</strong>
                  <span class="job-status" :class="'status-' + result.status">
                    {{ result.status }}
                  </span>
                </div>
                <div class="job-details">
                  <span
                    ><strong>Analysis Time:</strong>
                    {{ result.timestamp }}</span
                  >
                  <span><strong>Tool:</strong> TNT Analysis</span>
                </div>
              </div>
              <div class="job-actions">
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="downloadResultFile(result)"
                  title="Download NEXUS result file"
                >
                  <i class="fa-solid fa-download"></i> Download
                </button>
              </div>
            </div>
            <div class="job-metadata">
              <div v-if="result.analysisParams" class="job-parameters">
                <strong>Parameters:</strong>
                {{ formatAnalysisParameters(result.analysisParams) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Session actions - only show when there are results -->
        <div v-if="sessionResults.length > 0" class="session-actions mt-3">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            @click="sessionResults = []"
          >
            <i class="fa-solid fa-trash"></i> Clear Session Results
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tnt-analysis-container {
  width: 100%;
}

.tab-content-buttons {
  display: flex;
  gap: 8px;
}

/* TNT form styling - matching CIPRES form */
.tnt-file-section {
  max-width: none;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .col-md-3,
.form-row .col-md-4,
.form-row .col-md-6,
.form-row .col-md-9,
.form-row .col-md-12 {
  flex: 1;
}

.form-row .col-md-3 {
  flex: 0 0 25%;
}

.form-row .col-md-4 {
  flex: 0 0 33.333%;
}

.form-row .col-md-6 {
  flex: 0 0 50%;
}

.form-row .col-md-9 {
  flex: 0 0 75%;
}

.form-row .col-md-12 {
  flex: 0 0 100%;
}

.read-only {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

.bold_hr {
  text-align: left;
  margin-left: 0;
  height: 5px;
  background-color: silver;
}

.red {
  color: red;
}

/* TNT Results section styling */
.tnt-results-section {
  border-top: 2px solid #28a745;
  padding-top: 15px;
}

.tnt-results-section .alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
  border-radius: 6px;
}

.tnt-results-section h6 {
  margin-bottom: 10px;
  color: #155724;
}

.tnt-results-section .results-actions {
  margin-top: 15px;
}

.tnt-results-section .results-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #28a745;
}

.tnt-results-section .result-details {
  margin-top: 8px;
}

.tnt-results-section .btn-success {
  background-color: #28a745;
  border-color: #28a745;
}

.tnt-results-section .btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

/* Session Results List styling - CIPRES-style job cards */
.session-results-section {
  border-top: 2px solid #007bff;
  padding-top: 15px;
}

.session-results-section h6 {
  margin-bottom: 15px;
  color: #007bff;
  font-weight: 600;
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
}

/* Job card styling matching CIPRES format */
.job-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.job-info {
  flex: 1;
}

.job-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.job-title strong {
  font-size: 1.1em;
  color: #333;
}

.job-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
  text-transform: uppercase;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-running {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-failed {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-pending {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.status-unknown {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.job-details {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.9em;
}

.job-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.job-metadata {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.job-parameters {
  margin-bottom: 8px;
  color: #555;
  font-size: 0.9em;
  line-height: 1.4;
}

.job-parameters:last-child {
  margin-bottom: 0;
}

.session-actions {
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.no-results-message {
  margin-bottom: 0;
}

.no-results-message .alert {
  margin-bottom: 0;
  border-radius: 6px;
  background-color: #e7f3ff;
  border-color: #b8daff;
  color: #004085;
}

/* Search Type Selection Styling */
.search-type-options {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.search-type-options .form-check {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.search-type-options .form-check:hover {
  background-color: #e9ecef;
}

.search-type-options .form-check:last-child {
  margin-bottom: 0;
}

.search-type-options .form-check-label {
  display: block;
  cursor: pointer;
  font-weight: 500;
}

.search-type-options .form-check-input:disabled + .form-check-label {
  cursor: not-allowed;
  opacity: 0.6;
}

.search-type-options .form-check-input:disabled {
  cursor: not-allowed;
}

.search-description {
  display: block;
  font-size: 0.9em;
  color: #6c757d;
  font-weight: normal;
  margin-top: 4px;
  font-style: italic;
}

/* Search Parameters Styling */
.search-parameters {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
}

.parameters-title {
  color: #495057;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-parameters .row {
  margin-bottom: 15px;
}

.search-parameters .row:last-child {
  margin-bottom: 0;
}

.search-parameters .form-check {
  margin-bottom: 10px;
}

.search-parameters .form-check:last-child {
  margin-bottom: 0;
}

/* Search Info Styling */
.search-info .alert {
  border-left: 4px solid #17a2b8;
  background-color: #e3f2fd;
  border-color: #bee5eb;
  color: #0c5460;
}

.search-info .alert i {
  margin-right: 8px;
  color: #17a2b8;
}

.search-info code {
  background-color: #f1f3f4;
  color: #d63384;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* Matrix info styling */
.matrix-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.matrix-info p {
  margin-bottom: 8px;
  color: #495057;
}

/* Analysis section styling */
.analysis-section {
  margin-top: 20px;
}

.analysis-separator {
  border: none;
  height: 2px;
  background: linear-gradient(to right, #007bff, #28a745);
  margin: 20px 0;
}

.analysis-title {
  color: #007bff;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-description {
  color: #6c757d;
  font-size: 0.95em;
  margin-bottom: 0;
  line-height: 1.4;
}
</style>
