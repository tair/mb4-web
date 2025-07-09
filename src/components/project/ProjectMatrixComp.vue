<script setup>
import axios from 'axios'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useFileTransferStore } from '@/stores/FileTransferStore'
import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import { getTaxonomicUnitOptions } from '@/utils/taxa'
import { serializeMatrix } from '@/lib/MatrixSerializer.ts'
import { mergeMatrix } from '@/lib/MatrixMerger.js'
import { useCharactersStore } from '@/stores/CharactersStore'
import { useTaxaStore } from '@/stores/TaxaStore'

const props = defineProps({
  matrix: {
    type: Object,
    required: true,
  },
  partitions: {
    type: Object,
    required: true,
  },
  canEditMatrix: {
    type: Boolean,
    required: true,
  },
})

const formats = new Map()
const matrix = props.matrix
if (!matrix.counts.continuous_character) {
  formats.set('nexus', 'NEXUS')
}
if (!matrix.counts.continuous_character && matrix.type != 1) {
  formats.set('nexml', 'NeXML')
}
if (matrix.type != 1) {
  formats.set('tnt', 'TNT')
}

const route = useRoute()
const router = useRouter()
const matricesStore = useMatricesStore()
const fileTransferStore = useFileTransferStore()
const taxaStore = useTaxaStore()
const charactersStore = useCharactersStore()
const notes = ref(true)
const format = ref(formats.keys()?.next()?.value)
const partitionId = ref('')

// Merge file functionality
const matrixFileData = ref({
  file: null,
  notes: '',
  otu: 'genus',
})
const isUploading = ref(false)
const uploadErrors = ref({})
const taxonomicUnits = getTaxonomicUnitOptions()
const parsedMatrix = ref(null)

const projectId = route.params.id
const matrixId = props.matrix.matrix_id
const baseUrl = `${
  import.meta.env.VITE_API_URL
}/projects/${projectId}/matrices/${matrixId}`

async function onDownloadMatrix() {
  const url = new URL(`${baseUrl}/download`)
  const searchParams = url.searchParams
  if (notes.value) {
    searchParams.append('notes', notes.value)
  }
  if (format.value) {
    searchParams.append('format', format.value)
  }
  if (partitionId.value) {
    searchParams.append('partitionId', partitionId.value)
  }
  window.location.href = url
  logDownload({
    project_id: projectStore.project_id,
    download_type: DOWNLOAD_TYPES.MATRIX,
    row_id: matrixId,
  })
}

async function onDownloadCharacters() {
  const url = new URL(`${baseUrl}/download/characters`)
  const searchParams = url.searchParams
  if (notes.value) {
    searchParams.append('notes', notes.value)
  }
  if (partitionId.value) {
    searchParams.append('partitionId', partitionId.value)
  }
  window.location.href = url
  logDownload({
    project_id: projectStore.project_id,
    download_type: DOWNLOAD_TYPES.MATRIX,
    row_id: matrixId,
  })
}

async function onDownloadOntology() {
  const url = new URL(`${baseUrl}/download/ontology`)
  window.location.href = url
  logDownload({
    project_id: projectId,
    download_type: DOWNLOAD_TYPES.MATRIX,
    row_id: matrixId,
  })
}

async function toggleMatrixStreaming() {
  const url = new URL(`${baseUrl}/setPreference`)
  const value = !matrix.preferences?.ENABLE_STREAMING | 0
  const response = await axios.post(url, {
    name: 'ENABLE_STREAMING',
    value: value,
  })
  if (response.status == 200) {
    matrix.preferences.ENABLE_STREAMING = value
  } else {
    alert(response.data?.message || 'Failed to set preferences')
  }
}

function navigateToSettings() {
  router.push(`/myprojects/${projectId}/matrices/${matrixId}/settings`)
}

// Merge file functionality
function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    matrixFileData.value.file = file
    // Parse the file when it's selected
    parseMatrixFile(file)
  }
}

async function parseMatrixFile(file) {
  try {
    uploadErrors.value = {}
    const parser = await import('@/lib/matrix-parser/parseMatrix.ts')
    const reader = new FileReader()

    reader.onload = function () {
      try {
        const matrixObject = parser.parseMatrix(reader.result)
        if (matrixObject) {
          // Convert MatrixObject to serializable format for sessionStorage
          const convertedMatrix = {
            // Copy basic properties
            format: matrixObject.getFormat(),
            parameters: matrixObject.getParameters() || {},
            blocks: matrixObject.getBlocks() || [],

            // Convert characters to Map
            characters: new Map(),

            // Convert taxa to Map
            taxa: new Map(),

            // Convert cells to 2D array for backend
            cellsArray: [],
          }

          // Process characters
          const characters = matrixObject.getCharacters()
          characters.forEach((character, index) => {
            character.characterNumber = index
            convertedMatrix.characters.set(character.name, character)
          })

          // Process taxa
          const taxaNames = matrixObject.getTaxaNames()
          taxaNames.forEach((taxonName) => {
            // Get the actual taxon object from the MatrixObject
            const actualTaxon = Array.from(matrixObject.taxa.values()).find(
              (t) => t.name === taxonName
            )
            const taxon = {
              name: taxonName,
              note: actualTaxon?.note || '',
              extinct: actualTaxon?.extinct || false,
              duplicateTaxon: actualTaxon?.duplicateTaxon || '',
            }
            convertedMatrix.taxa.set(taxonName, taxon)
          })

          // Process cells - create 2D array structure for backend
          const charactersArray = matrixObject.getCharacters()
          const cellsArray = []

          // For each taxon (row)
          for (
            let taxonIndex = 0;
            taxonIndex < taxaNames.length;
            taxonIndex++
          ) {
            const taxonName = taxaNames[taxonIndex]
            const taxonCells = matrixObject.getCells(taxonName) || []
            const cellRow = []

            // For each character (column)
            for (
              let charIndex = 0;
              charIndex < charactersArray.length;
              charIndex++
            ) {
              const cell = taxonCells[charIndex]

              if (cell !== undefined && cell !== null) {
                // Convert Cell object to string value
                if (typeof cell === 'object' && cell.score !== undefined) {
                  // This is a Cell object, extract the score and ensure it's a string
                  const score = String(cell.score || '?')
                  cellRow.push(score)
                } else if (typeof cell === 'string' && cell.length > 0) {
                  // Already a string, but ensure it's not empty
                  cellRow.push(cell)
                } else {
                  // Convert to string, but handle empty/null values
                  const converted = String(cell)
                  cellRow.push(
                    converted === 'null' ||
                      converted === 'undefined' ||
                      converted === ''
                      ? '?'
                      : converted
                  )
                }
              } else {
                // Empty cell - use missing symbol
                cellRow.push('?')
              }
            }

            // Ensure the row has the correct number of columns
            while (cellRow.length < charactersArray.length) {
              cellRow.push('?')
            }

            cellsArray.push(cellRow)
          }

          // Add the 2D array structure for backend serialization
          convertedMatrix.cellsArray = cellsArray
          parsedMatrix.value = convertedMatrix
        } else {
          uploadErrors.value.general =
            'Failed to parse matrix file. Please check the file format.'
          parsedMatrix.value = null
        }
      } catch (error) {
        console.error('Error parsing matrix file:', error)
        uploadErrors.value.general =
          'Failed to parse matrix file: ' + error.message
        parsedMatrix.value = null
      }
    }

    reader.onerror = function () {
      uploadErrors.value.general = 'Failed to read file'
      parsedMatrix.value = null
    }

    reader.readAsBinaryString(file)
  } catch (error) {
    console.error('Error importing parser:', error)
    uploadErrors.value.general = 'Failed to load matrix parser'
    parsedMatrix.value = null
  }
}

async function handleMergeFileUpload() {
  if (!matrixFileData.value.file) {
    uploadErrors.value.general = 'Please select a file to upload.'
    return
  }

  if (!parsedMatrix.value) {
    uploadErrors.value.general =
      'Please wait for the file to be parsed or select a valid matrix file.'
    return
  }

  isUploading.value = true
  uploadErrors.value = {}

  try {
    // Load taxa and characters stores if not already loaded
    if (!taxaStore.isLoaded) {
      await taxaStore.fetch(projectId)
    }
    if (!charactersStore.isLoaded) {
      await charactersStore.fetchCharactersByProjectId(projectId)
    }

    // Merge the parsed matrix with existing project data
    mergeMatrix(
      parsedMatrix.value,
      matrixFileData.value.otu,
      matrixFileData.value.notes,
      taxaStore.taxa,
      charactersStore.characters
    )

    // Store the actual File object in the FileTransferStore
    fileTransferStore.setMergeFile(matrixFileData.value.file, {
      otu: matrixFileData.value.otu,
      itemNotes: matrixFileData.value.notes,
    })
    // console.log('File stored in FileTransferStore:', matrixFileData.value.file.name, matrixFileData.value.file.size, 'bytes')

    // Store the merge data in sessionStorage to pass to create matrix view
    const mergeData = {
      matrixId: matrixId,
      isEdit: true,
      importedMatrix: {
        // Copy basic properties
        format: parsedMatrix.value.format,
        parameters: parsedMatrix.value.parameters,
        blocks: parsedMatrix.value.blocks,
        // Convert Maps to arrays for JSON serialization
        characters: Array.from(parsedMatrix.value.characters.entries()),
        taxa: Array.from(parsedMatrix.value.taxa.entries()),
        cells: parsedMatrix.value.cellsArray,
      },
      formData: {
        otu: matrixFileData.value.otu,
        itemNotes: matrixFileData.value.notes,
      },
    }

    sessionStorage.setItem('matrixMergeData', JSON.stringify(mergeData))

    // Navigate to create matrix view at step 2 (characters page)
    router.push({
      path: `/myprojects/${projectId}/matrices/create`,
      query: {
        step: '2',
        merge: 'true',
        matrixId: matrixId,
      },
    })
  } catch (error) {
    console.error('Error processing matrix merge:', error)
    uploadErrors.value.general =
      'Failed to process matrix file. Please try again.'
  } finally {
    isUploading.value = false
  }
}

function resetMergeForm() {
  matrixFileData.value.file = null
  matrixFileData.value.notes = ''
  matrixFileData.value.otu = 'genus'
  uploadErrors.value = {}
  parsedMatrix.value = null

  // Clear file input
  const fileInput = document.getElementById(`upload-${matrixId}`)
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>
<template>
  <div class="p-2 card shadow matrix-card">
    <div class="title">
      <div class="header">
        {{ matrix.title }} (<i>matrix {{ matrix.matrix_id }}</i
        >)
      </div>
      <div class="buttons">
        <RouterLink
          :to="`/myprojects/${projectId}/matrices/${matrix.matrix_id}/edit`"
          target="_blank"
        >
          <button type="button" class="btn btn-sm btn-primary">Open</button>
        </RouterLink>
        <button
          v-if="canEditMatrix"
          type="button"
          class="btn btn-sm btn-secondary"
          tooltip="Click here to name this matrix, block the scoring, and use various automated features"
          @click="navigateToSettings"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-sm btn-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
          >
            <i class="fa-solid fa-gear"></i>
          </button>
          <div class="dropdown-menu">
            <h6 class="dropdown-header">Settings:</h6>
            <div class="dropdown-divider"></div>
            <button
              type="button"
              class="dropdown-item"
              @click="toggleMatrixStreaming"
            >
              <i
                class="fa-solid fa-check"
                :class="{ hidden: !matrix.preferences?.ENABLE_STREAMING }"
              ></i>
              Enable Streaming
            </button>
          </div>
        </div>
      </div>
    </div>
    <ul class="nav nav-tabs" id="myTab" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="homeTab"
          data-bs-toggle="tab"
          :data-bs-target="'#home' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="home"
          aria-selected="true"
        >
          Home
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#download' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="profile"
          aria-selected="false"
        >
          Download
        </button>
      </li>
      <li v-if="canEditMatrix" class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#merge' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="merge"
          aria-selected="false"
        >
          Merge File
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#build' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="contact"
          aria-selected="false"
        >
          Build a Tree
        </button>
      </li>
    </ul>
    <div class="tab-content">
      <div
        class="tab-pane fade show active"
        :id="'home' + matrix.matrix_id"
        role="tabpanel"
      >
        The matrix contains:
        <div class="description">
          {{ matrix.counts.cell ?? 0 }} scorings;
          {{ matrix.counts.taxa ?? 0 }} taxa;
          {{ matrix.counts.character ?? 0 }} characters;
          {{ matrix.counts.cell_media ?? 0 }} cell images;
          {{ matrix.counts.media_label ?? 0 }} labels attached to cell images;
          {{ matrix.counts.character_media ?? 0 }} character images;
        </div>
        <RouterLink
          :to="`/myprojects/${projectId}/matrices/${matrix.matrix_id}/characters`"
          target="_blank"
        >
          <button type="button" class="btn btn-primary">Edit Characters</button>
        </RouterLink>
      </div>
      <div
        class="tab-pane fade"
        :id="'download' + matrix.matrix_id"
        role="tabpanel"
      >
        <h6>Download options:</h6>
        <div class="downloadOptions">
          <div>
            <label>Format:</label>
            <select v-model="format">
              <option v-for="[format, name] in formats" v-bind:value="format">
                {{ name }}
              </option>
            </select>
          </div>
          <div>
            <label>Partition:</label>
            <select v-model="partitionId">
              <option value="" selected disabled>Entire Matrix</option>
              <option
                v-for="partition in partitions"
                v-bind:value="partition.partition_id"
              >
                Partition: {{ partition.name }}
              </option>
            </select>
          </div>
          <div class="form-check">
            <input
              v-model="notes"
              class="form-check-input"
              type="checkbox"
              value="1"
              id="flexCheckChecked"
              checked
            />
            <label class="form-check-label" for="flexCheckChecked">
              Include Notes
            </label>
          </div>
        </div>
        <em v-if="matrix.counts.continuous_character">
          NEXUS-format downloads are unavailable for this matrix because it
          contains continuous characters.
        </em>
        <br />
        <em v-if="matrix.counts.polymorphoric_cell">
          This matrix contains polymorphic scores for "-" and another state,
          e.g., (-,1). Thus, this matrix will not load in Mesquite.
        </em>
        <br />
        <div class="tab-content-buttons">
          <button
            type="button"
            class="btn btn-primary"
            @click="onDownloadMatrix"
          >
            Download Matrix
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="onDownloadCharacters"
          >
            Download Characters
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="onDownloadOntology"
          >
            Download Ontology
          </button>
        </div>
      </div>
      <div
        v-if="canEditMatrix"
        class="tab-pane fade"
        :id="'merge' + matrix.matrix_id"
        role="tabpanel"
      >
        <h6>Merge a NEXUS or TNT file with this matrix</h6>

        <!-- Error Messages -->
        <div v-if="uploadErrors.general" class="alert alert-danger mb-3">
          {{ uploadErrors.general }}
        </div>

        <div class="merge-file-section">
          <div class="alert alert-secondary mb-3">
            <strong>Note</strong> – your matrix must have character names for
            all the characters and these character names must each be different.
            If this is a file with combined molecular and morphological data, or
            molecular data only, it must be submitted to the Documents area.
          </div>

          <div class="form-group mb-3">
            <label class="form-label">NEXUS or TNT file to add to matrix</label>
            <input
              type="file"
              :id="'upload-' + matrix.matrix_id"
              class="form-control"
              accept=".nex,.nexus,.tnt"
              @change="handleFileChange"
            />
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Operational taxonomic unit</label>
            <select class="form-control" v-model="matrixFileData.otu">
              <option
                v-for="unit in taxonomicUnits"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }}
              </option>
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">
              Descriptive text to add to each character and taxon added to the
              project from this file
            </label>
            <textarea
              rows="3"
              class="form-control"
              v-model="matrixFileData.notes"
              placeholder="Optional notes..."
            ></textarea>
          </div>

          <div class="tab-content-buttons">
            <button
              type="button"
              class="btn btn-primary"
              @click="handleMergeFileUpload"
              :disabled="isUploading || !matrixFileData.file"
            >
              <span
                v-if="isUploading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isUploading ? 'Processing...' : 'Review Characters' }}
            </button>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="resetMergeForm"
              :disabled="isUploading"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <div
        class="tab-pane fade"
        :id="'build' + matrix.matrix_id"
        role="tabpanel"
      >
        <!-- TODO(kenzley): Create the text when working on the CIPRES integration. -->
        ...
      </div>
    </div>
  </div>
</template>
<style scoped>
.matrix-card {
  margin-bottom: 12px;
}

.matrix-card .title {
  display: flex;
  font-weight: bold;
  margin-bottom: 8px;
}
.matrix-card .title .header {
  display: flex;
  flex: 1;
  margin: auto;
  text-overflow: ellipsis;
}

.matrix-card .title .buttons {
  display: flex;
  gap: 7px;
}

.matrix-card .tab-content {
  padding: 20px;
}

.matrix-card .description {
  padding: 10px;
}

.tab-content-buttons {
  display: flex;
  gap: 8px;
}

.merge-file-section {
  max-width: 600px;
}

.merge-upload-section {
  margin-left: 20px;
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background-color: #f8f9fa;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.downloadOptions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.downloadOptions > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.downloadOptions label {
  min-width: 80px;
  font-weight: 500;
}

.hidden {
  visibility: hidden;
}
</style>
