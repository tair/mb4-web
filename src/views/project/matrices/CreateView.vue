<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/CharactersStore'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useFileTransferStore } from '@/stores/FileTransferStore'
import { useNotifications } from '@/composables/useNotifications'
import { NavigationPatterns } from '@/utils/navigationUtils.js'
import { CharacterStateIncompleteType } from '@/lib/matrix-parser/MatrixObject.ts'
import { getIncompleteStateText } from '@/lib/matrix-parser/text.ts'
import { mergeMatrix } from '@/lib/MatrixMerger.js'
import { serializeMatrix } from '@/lib/MatrixSerializer.ts'
import { getTaxonomicUnitOptions } from '@/utils/taxa'
import { convertCsvToMatrix } from '@/utils/csvConverter.js'
import router from '@/router'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const taxaStore = useTaxaStore()
const matricesStore = useMatricesStore()
const charactersStore = useCharactersStore()
const fileTransferStore = useFileTransferStore()
const { showError, showSuccess } = useNotifications()
const uploadError = ref('')
const uploadTask = ref({ id: null, status: null })
const projectId = route.params.id
const isConvertingCsv = ref(false)
const uploadType = computed(() => route.query.uploadType || 'nexus')

// Taxonomic unit options for dropdown
const taxonomicUnits = getTaxonomicUnitOptions()

const importedMatrix = reactive({})
const isProcessingMatrix = ref(false)
const defaultNumbering = computed(() =>
  importedMatrix.format == 'NEXUS' ? 1 : 0
)
const incompletedCharactersCount = computed(() => {
  let count = 0
  if (!importedMatrix.characters) {
    return 0
  }

  for (const character of importedMatrix.characters.values()) {
    if (!character.states) {
      continue
    }
    for (const state of character?.states) {
      if (state.incompleteType) {
        ++count
      }
    }
  }

  return count
})
const duplicatedCharacters = computed(() => {
  if (!importedMatrix.characters) {
    return []
  }
  const duplicateCharactersNames = {}
  for (const character of importedMatrix.characters.values()) {
    if (character.duplicateCharacter) {
      const originalCharacterName = character.duplicateCharacter
      if (!duplicateCharactersNames.hasOwnProperty(originalCharacterName)) {
        duplicateCharactersNames[originalCharacterName] = []
      }
      duplicateCharactersNames[originalCharacterName].push(character.name)
    }
  }
  return duplicateCharactersNames
})

let editingCharacter = ref({})
function editCharacter(character) {
  editingCharacter.value = JSON.parse(JSON.stringify(character))
  return false
}

function cancelEditedCharacter() {
  editingCharacter.value = {}
}

function removeCharacterState(character, index) {
  if (character.states.length - 1 <= character.maxScoredStatePosition) {
    const confirmed = confirm(
      `Warning: The data matrix you uploaded has at least ${
        Number(character.maxScoredStatePosition) + 1
      } states for this character. Deleting this state may cause issues with your matrix data.\n\nDo you want to delete it anyway?`
    )
    if (!confirmed) {
      return
    }
  }

  character.states.splice(index, 1)
}

function saveEditedCharacter() {
  // Validate character states before saving
  if (editingCharacter.value.states) {
    const stateNames = new Set()
    for (const state of editingCharacter.value.states) {
      const stateName = state.name
      if (stateName == null || stateName.length == 0) {
        showError('All states must have non-empty names.')
        return
      }
      if (state.name.match(/State\ \d+$/)) {
        showError(
          `You must rename the generic state: '${state.name}' or recode the character in the matrix.`
        )
        return
      }
      if (stateNames.has(stateName)) {
        showError('All states must have unique names.')
        return
      }
      if (stateName.length > 500) {
        showError('All states must names that are under 500 characters.')
        return
      }
      stateNames.add(stateName)
    }

    // Clear incomplete type flags if validation passes
    for (const state of editingCharacter.value.states) {
      delete state.incompleteType
    }
  }

  const characterNumber = editingCharacter.value.characterNumber
  const keys = Array.from(importedMatrix.characters.keys())
  const name = keys[characterNumber]
  const character = importedMatrix.characters.get(name)
  Object.assign(character, JSON.parse(JSON.stringify(editingCharacter.value)))
  updateIncompleteType(character)
}

function updateIncompleteType(character) {
  if (character.states) {
    const stateNames = new Map()
    for (const state of character.states) {
      const stateName = state.name
      if (stateName == null || stateName.length == 0) {
        state.incompleteType = CharacterStateIncompleteType.EMPTY_NAME
      } else if (state.name.match(/State\ \d+$/)) {
        state.incompleteType = CharacterStateIncompleteType.GENERIC_STATE
      } else if (stateNames.has(stateName)) {
        state.incompleteType = CharacterStateIncompleteType.DUPLICATE_SATE
        const otherState = stateNames.get(stateName)
        otherState.incompleteType = CharacterStateIncompleteType.DUPLICATE_SATE
      } else if (stateName.length > 500) {
        state.incompleteType = CharacterStateIncompleteType.NAME_TOO_LONG
      } else {
        delete state.incompleteType
      }
      stateNames.set(stateName, state)
    }
  }
  return false
}

let currentEditingTaxonName = null
let editingTaxon = ref({})
function editTaxon(taxon) {
  currentEditingTaxonName = taxon.name
  editingTaxon.value = JSON.parse(JSON.stringify(taxon))
  return false
}

function cancelEditedTaxon() {
  currentEditingTaxonName = null
  editingTaxon.value = {}
}

function saveEditedTaxon() {
  const taxon = importedMatrix.taxa.get(currentEditingTaxonName)
  Object.assign(taxon, JSON.parse(JSON.stringify(editingTaxon.value)))
}

async function importMatrix(event) {
  const files = event.target?.files
  if (files == null || files.length == 0) {
    return
  }

  const file = files[0]
  
  // Clear any previous errors
  uploadError.value = ''
  
  // Check if this is a CSV/Excel file that needs conversion
  const fileExt = file.name.toLowerCase().split('.').pop()
  if (uploadType.value === 'csv' && (fileExt === 'csv' || fileExt === 'xlsx')) {
    await handleCsvConversion(file)
    return
  }

  // Normal NEX/TNT file processing
  const parser = await import('@/lib/matrix-parser/parseMatrix.ts')
  const reader = new FileReader()
  reader.onload = function () {
    try {
      const result = parser.parseMatrixWithErrors(reader.result)
      if (result.error) {
        // Display validation error below the upload field (not notification)
        uploadError.value = result.error.userMessage
        // Clear the file input
        const fileInput = document.getElementById('upload')
        if (fileInput) {
          fileInput.value = ''
        }
        return
      }
      if (result.matrixObject) {
        Object.assign(importedMatrix, result.matrixObject)
        uploadError.value = '' // Clear error on success
      } else {
        uploadError.value = 'Failed to parse matrix file. Please ensure the file is a valid NEXUS or TNT format.'
      }
    } catch (error) {
      uploadError.value = 'Failed to parse matrix file: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }

  reader.onerror = function () {
    uploadError.value = 'Failed to read file'
  }

  reader.readAsBinaryString(file)
}

async function handleCsvConversion(file) {
  isConvertingCsv.value = true
  uploadError.value = ''

  try {
    // Create a custom error handler that stores errors in uploadError.value
    const errorHandler = (message) => {
      uploadError.value = message
      throw new Error(message) // Throw to trigger catch block
    }
    
    const { matrixObject, result } = await convertCsvToMatrix(file, projectId, errorHandler)
    Object.assign(importedMatrix, matrixObject)
    uploadError.value = '' // Clear any errors on success
    showSuccess(`Successfully converted ${file.name} to ${result.format.toUpperCase()} format`)
  } catch (error) {
    // Error already stored in uploadError.value by errorHandler
    // Clear the file input
    const fileInput = document.getElementById('upload')
    if (fileInput) {
      fileInput.value = ''
    }
  } finally {
    isConvertingCsv.value = false
  }
}

function moveUpload() {
  // Clear any previous errors when going back to upload step
  uploadError.value = ''
  moveToStep('step-1')
  return false
}

async function moveToCharacters() {
  if (!importedMatrix.taxa || !importedMatrix.characters) {
    uploadError.value = 'Please upload a valid matrix file first'
    return false
  }

  // Clear upload error when successfully moving forward
  uploadError.value = ''
  
  isProcessingMatrix.value = true
  try {
    if (taxaStore.isLoaded && charactersStore.isLoaded) {
      const otu = document.getElementById('otu')
      const itemNote = document.getElementById('item-notes')
      mergeMatrix(
        importedMatrix,
        otu.value,
        itemNote.value,
        taxaStore.taxa,
        charactersStore.characters
      )
    } else {
      // Add a loading screen when the taxa and characters are not loaded. We will
      // delay component and move on the step-2 when taxa and characters have
      // loaded. Consider using AsyncComponents
    }
    moveToStep('step-2')
  } finally {
    isProcessingMatrix.value = false
  }
  return false
}

function moveToTaxa() {
  moveToStep('step-3')
  return false
}

function moveToStep(step) {
  const steps = document.getElementsByClassName('btn-circle')
  for (const step of steps) {
    step.classList.remove('btn-primary')
  }

  const step2 = document.querySelector(`.btn-circle[href="#${step}"]`)
  step2.classList.add('btn-primary')

  const stepContents = document.getElementsByClassName('setup-content')
  for (const stepContent of stepContents) {
    stepContent.style.display = 'none'
  }
  const stepContent = document.getElementById(step)
  stepContent.style.display = 'unset'

  window.scrollTo(0, 0)
}

let isUploading = ref(false)

async function uploadMatrix() {
  isUploading.value = true
  
  // Frontend validation to prevent malformed matrices from reaching backend
  const validationResult = validateMatrixForUpload(importedMatrix)
  if (!validationResult.ok) {
    showError(validationResult.message)
    isUploading.value = false
    return
  }

  try {
    const formData = new FormData()

    const title = document.getElementById('matrix-title')
    formData.set('title', title.value)

    const notes = document.getElementById('matrix-notes')
    formData.set('notes', notes.value)

    const itemNotes = document.getElementById('item-notes')
    formData.set('itemNotes', itemNotes.value)

    const otu = document.getElementById('otu')
    formData.set('otu', otu.value)

    const published = document.getElementById('published')
    formData.set('published', published.value)

    // Check if this is a merge operation
    const isMerge = route.query.merge === 'true'
    const matrixId = route.query.matrixId

    // Handle file differently for merge vs new matrix
    if (isMerge) {
      // For merge operations, get the file from FileTransferStore
      const mergeFile = fileTransferStore.getMergeFile()
      formData.set('matrixId', matrixId)
      // console.log('Merge file from store:', mergeFile ? `${mergeFile.name} (${mergeFile.size} bytes)` : 'null')
      if (mergeFile) {
        formData.set('file', mergeFile)
      } else {
        showError('Merge file not found. Please go back and select a file again.')
        return
      }
    } else {
      // For new matrix creation, require file upload
      const file = document.getElementById('upload')
      if (!file.files[0]) {
        showError('Please select a file to upload.')
        return
      }
      formData.set('file', file.files[0])
    }

    const serializedMatrix = serializeMatrix(importedMatrix)
    formData.set('matrix', serializedMatrix)

    const response = await apiService.post(`/projects/${projectId}/matrices/upload`, formData, {
      // Keep a moderate timeout; server returns 202 quickly
      timeout: 60000,
    })

    // For async upload, expect 202 + taskId
    if (response.status === 202) {
      const data = await response.json()
      uploadTask.value = { id: data.taskId, status: 'queued' }

      // Poll task status until completed or failed
      await pollTaskStatus(data.taskId)

      // On success, clear state and navigate
      const isMerge = route.query.merge === 'true'
      if (isMerge) {
        fileTransferStore.clearMergeFile()
        sessionStorage.removeItem('matrixMergeData')
      }
      await matricesStore.invalidate()
      await NavigationPatterns.afterComplexResourceCreate(projectId, 'matrices')
      return
    }
    
    // If server returned 200 (small matrix fast path), proceed as before
    if (response.ok) {
      const isMerge = route.query.merge === 'true'
      if (isMerge) {
        fileTransferStore.clearMergeFile()
        sessionStorage.removeItem('matrixMergeData')
      }
      await matricesStore.invalidate()
      await NavigationPatterns.afterComplexResourceCreate(projectId, 'matrices')
    }
  } catch (error) {
    console.error('Error uploading matrix:', error)
    
    // Check if the error suggests a retry
    if (error.retry || error.code === 'DB_CONNECTION_ERROR' || error.code === 'DB_LOCK_TIMEOUT') {
      uploadError.value = `${error.message || 'A temporary issue occurred. Please try uploading again.'}`
    } else {
      // Non-retryable error
      uploadError.value =
        error.response?.data?.message ||
        error.message ||
        'Failed to upload matrix. Please check your file and try again.'
    }
  } finally {
    isUploading.value = false
  }
}

function validateMatrixForUpload(matrix) {
  try {
    const normalized = JSON.parse(serializeMatrix(matrix))
    const taxa = Array.isArray(normalized.taxa) ? normalized.taxa : []
    const characters = Array.isArray(normalized.characters) ? normalized.characters : []
    const cells = Array.isArray(normalized.cells) ? normalized.cells : []

    if (!taxa.length || !characters.length || !cells.length) {
      return { ok: false, message: 'Invalid matrix: missing taxa, characters, or cells.' }
    }
    if (cells.length !== taxa.length) {
      return { ok: false, message: `Invalid matrix: ${cells.length} rows but ${taxa.length} taxa.` }
    }
    for (let i = 0; i < cells.length; i++) {
      if (!Array.isArray(cells[i]) || cells[i].length !== characters.length) {
        const colCount = Array.isArray(cells[i]) ? cells[i].length : 0
        return {
          ok: false,
          message: `Invalid matrix: row ${i + 1} has ${colCount} columns; expected ${characters.length}.`,
        }
      }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, message: 'Invalid matrix: could not serialize for validation.' }
  }
}

async function pollTaskStatus(taskId) {
  // Poll every 2s up to 30 minutes
  const maxAttempts = 900
  let attempts = 0
  while (attempts < maxAttempts) {
    attempts++
    try {
      const res = await apiService.get(`/tasks/${taskId}/status`)
      const data = await res.json()
      uploadTask.value.status = data.status
      if (data.status === 'completed') return
      if (data.status === 'failed') {
        const msg = data.error?.message || 'Matrix import failed.'
        throw new Error(msg)
      }
    } catch (e) {
      // Bubble up failures
      throw e
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Matrix import timed out. Please check later or retry.')
}

function cancelImport() {
  // Clean up stores and sessionStorage
  const isMerge = route.query.merge === 'true'
  if (isMerge) {
    fileTransferStore.clearMergeFile()
    sessionStorage.removeItem('matrixMergeData')
  }
  router.push({ path: `/myprojects/${projectId}/matrices` })
}

function convertNewlines(text) {
  return text.replace(/\n/g, '<br>')
}

onMounted(async () => {
  if (!taxaStore.isLoaded) {
    await taxaStore.fetch(projectId)
  }

  if (!charactersStore.isLoaded) {
    await charactersStore.fetchCharactersByProjectId(projectId)
  }

  // Check if this is a merge operation and load data from sessionStorage
  const isMerge = route.query.merge === 'true'
  if (isMerge) {
    const mergeDataString = sessionStorage.getItem('matrixMergeData')
    if (mergeDataString) {
      try {
        const mergeData = JSON.parse(mergeDataString)

        // Restore the imported matrix data
        if (mergeData.importedMatrix) {
          // Restore basic properties
          importedMatrix.format = mergeData.importedMatrix.format
          importedMatrix.parameters = mergeData.importedMatrix.parameters || {}
          importedMatrix.blocks = mergeData.importedMatrix.blocks || []

          // Restore Maps from arrays
          importedMatrix.characters = new Map(
            mergeData.importedMatrix.characters
          )
          importedMatrix.taxa = new Map(mergeData.importedMatrix.taxa)
          importedMatrix.cells = mergeData.importedMatrix.cells
        }

        // Load taxa and characters stores if needed
        if (!taxaStore.isLoaded) {
          await taxaStore.fetch(projectId)
        }
        if (!charactersStore.isLoaded) {
          await charactersStore.fetchCharactersByProjectId(projectId)
        }

        // Set the step based on query parameter
        const step = route.query.step || '1'
        moveToStep(`step-${step}`)
      } catch (error) {
        console.error('Error loading merge data:', error)
      }
    }
  }
})

onUnmounted(() => {
  // Clean up file transfer store if user navigates away
  const isMerge = route.query.merge === 'true'
  if (isMerge) {
    fileTransferStore.clearMergeFile()
  }
})
</script>
<template>
  <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
    <i class="fa-solid fa-chevron-left"></i>
    <a class="nav-link m-0 p-0 pl-1" @click="$router.go(-1)">Back</a>
  </div>
  <div class="stepwizard">
    <div class="matrix-import-step-row setup-panel">
      <hr />
      <div class="matrix-import-step" v-if="route.query.merge !== 'true'">
        <a href="#step-1" type="button" class="btn btn-primary btn-circle">
          1
        </a>
        <p>Import</p>
      </div>
      <div class="matrix-import-step">
        <a
          href="#step-2"
          type="button"
          :class="
            route.query.merge === 'true'
              ? 'btn btn-primary btn-circle'
              : 'btn btn-default btn-circle'
          "
          :disabled="route.query.merge !== 'true' ? 'disabled' : false"
        >
          {{ route.query.merge === 'true' ? '1' : '2' }}
        </a>
        <p>Characters</p>
      </div>
      <div class="matrix-import-step">
        <a
          href="#step-3"
          type="button"
          class="btn btn-default btn-circle"
          disabled="disabled"
        >
          {{ route.query.merge === 'true' ? '2' : '3' }}
        </a>
        <p>Taxa</p>
      </div>
    </div>
    <div>
      <form @submit.prevent="moveToCharacters">
        <div
          class="row setup-content"
          id="step-1"
          :class="{ 'hidden-step': route.query.merge === 'true' }"
        >
          <div class="form-group">
            <label for="matrix-title">Title</label>
            <input
              type="text"
              class="form-control"
              id="matrix-title"
              ref="matrixTitle"
              required="required"
            />
          </div>
          <div class="form-group">
            <label for="matrix-notes">Notes</label>
            <textarea class="form-control" id="matrix-notes"></textarea>
          </div>
          <div class="form-group">
            <label for="otu">Operational taxonomic unit</label>
            <select id="otu" name="otu" class="form-control">
              <option
                v-for="unit in taxonomicUnits"
                :key="unit.value"
                :value="unit.value"
                :selected="unit.value === 'genus'"
              >
                {{ unit.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="matrix-notes">Publishing Status</label>
            <select id="published" name="published" class="form-control">
              <option value="0">Publish when project is published</option>
              <option value="1">Never publish to project</option>
            </select>
          </div>

          <fieldset class="form-group border p-3">
            <legend class="w-auto px-2">
              <template v-if="uploadType === 'csv'">
                Upload a CSV or Excel file to convert and create your matrix
              </template>
              <template v-else>
                Upload an existing NEXUS or TNT file as the basis of your matrix
              </template>
            </legend>
            <div v-if="uploadType === 'csv'" class="csv-upload-instructions">
              <p>
                Upload a CSV or Excel file containing your morphological matrix data. 
                The file will be automatically converted to NEXUS or TNT format.
              </p>
              <p><strong>For continuous data:</strong> your matrix must have taxa as rows and characters as columns, with character names as the first row.</p>
              <p><strong>For discrete data:</strong> your matrix must have taxa as rows and characters as columns, with character names in Row 1 and character states in Row 2 for each matched character column.</p>
              <p><strong>Mixed continuous and discrete character CSV or Excel files are currently NOT handled.</strong></p>
            </div>
            <p v-else>
              Note - your matrix must have character names for all the
              characters and these character names must each be different. If
              this is a file with combined molecular and morphological data, or
              molecular data only, it must be submitted to the Documents area.
            </p>
            <div class="form-group">
              <label for="matrix-notes">
                <template v-if="uploadType === 'csv'">
                  CSV or Excel file to convert and add to matrix
                </template>
                <template v-else>
                  NEXUS or TNT file to add to matrix
                </template>
              </label>
              <input
                type="file"
                id="upload"
                name="upload"
                :accept="uploadType === 'csv' ? '.csv,.xlsx' : '.nex,.nexus,.tnt'"
                class="form-control"
                @change="importMatrix"
                required="required"
              />
              <small v-if="isConvertingCsv" class="text-info d-block mt-2">
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                Converting CSV/Excel file to matrix format...
              </small>
              
              <!-- Validation Error Display -->
              <div v-if="uploadError" class="alert alert-danger mt-3 mb-0">
                {{ uploadError }}
              </div>
            </div>
            <div class="form-group">
              <label for="item-notes"
                >Descriptive text to add to each character and taxon added to
                the project from this file</label
              >
              <textarea class="form-control" id="item-notes"></textarea>
            </div>
          </fieldset>
          <div class="btn-step-group">
            <button
              class="btn btn-outline-primary btn-step-prev"
              type="button"
              @click="cancelImport"
            >
              Cancel
            </button>
            <button
              class="btn btn-primary btn-step-next"
              type="submit"
              :disabled="isUploading || isProcessingMatrix || isConvertingCsv"
            >
              <span
                v-if="isProcessingMatrix || isConvertingCsv"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{
                isConvertingCsv
                  ? 'Converting...'
                  : isProcessingMatrix
                  ? 'Parsing...'
                  : isUploading
                  ? 'Uploading...'
                  : 'Next'
              }}
            </button>
          </div>
          
        </div>
        <div class="row setup-content" id="step-2">
          <h5 v-if="route.query.merge === 'true'">
            We found {{ importedMatrix?.characters?.size }} characters to merge
            into your matrix.
          </h5>
          <h5 v-else>
            We found {{ importedMatrix?.characters?.size }} characters in your
            matrix.
          </h5>

          <div
            v-if="Object.keys(duplicatedCharacters).length"
            class="duplicate-characters"
          >
            <span>
              Duplicate characters have been detected and renamed to distinguish
              them from the first instance of the following characters:
            </span>
            <ul>
              <li v-for="(characters, key) in duplicatedCharacters">
                {{ characters.length + 1 }} characters named "{{ key }}".
                Duplicate{{ characters.length > 1? 's have' : ' has' }} been
                renamed to "{{
                  characters.length === 1
                    ? characters[0]
                    : characters.length === 2
                      ? characters[0] + '" and "' + characters[1]
                      : characters.slice(0, -1).join('", "') + '", and "' + characters.at(-1)
                }}"
              </li>
            </ul>
          </div>

          <p v-if="incompletedCharactersCount > 0">
            {{
              incompletedCharactersCount == 1
                ? '1 state has'
                : `${incompletedCharactersCount} states have`
            }}
            been flagged in <b class="flagged">RED</b> for incompleteness.
            Please review and (1) update the missing character state information
            on the screen, save your edits and click next or (2) update the data
            matrix file and reupload.
          </p>
          <p v-else-if="route.query.merge === 'true'">
            Please review the characters that will be merged into your existing
            matrix.
          </p>
          <p v-else>
            Please confirm that the character and their states are correct.
          </p>
          <div
            class="matrix-loading-screen py-5"
            v-if="!taxaStore.isLoaded || !charactersStore.isLoaded"
          >
            <div class="spinner-border text-success" role="status"></div>
            Loading...
          </div>
          <div class="matrix-confirmation-screen" v-else>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>States</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="character in importedMatrix?.characters?.values()">
                  <td :id="`character${character.characterNumber}`">
                    {{ character.characterNumber + defaultNumbering }}
                  </td>
                  <td>
                    {{ character.name }}
                    <p class="notes" v-if="character.note">
                      <b>Notes:</b>
                      <br />
                      <i v-html="convertNewlines(character.note)"></i>
                    </p>
                  </td>
                  <td>
                    <b v-if="character.type == 1">(continuous character)</b>
                    <b v-else-if="character.type == 2"
                      >(meristic character)</b
                    >
                    <ol v-else-if="character.states">
                      <li
                        v-for="state in character.states"
                        :class="{ flagged: state.incompleteType }"
                      >
                        {{ state.name }}
                      </li>
                    </ol>

                    <p
                      class="incomplete-state-warning"
                      v-for="incompleteState in new Set(
                        character.states
                          .map((s) => s.incompleteType)
                          .filter((w) => !!w)
                      )"
                    >
                      {{ getIncompleteStateText(incompleteState) }}
                    </p>
                  </td>
                  <td>
                    <a
                      :href="`#character${character.characterNumber}`"
                      data-bs-toggle="modal"
                      data-bs-target="#characterModal"
                      @click.stop.prevent="editCharacter(character)"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="btn-step-group">
            <button
              v-if="route.query.merge !== 'true'"
              class="btn btn-primary btn-step-prev"
              type="button"
              @click="moveUpload"
            >
              Prev
            </button>
            <button
              type="button"
              class="btn btn-primary btn-step-next"
              :disabled="incompletedCharactersCount > 0"
              @click="moveToTaxa"
            >
              Next
            </button>
          </div>
        </div>
        <div class="modal" id="characterModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Character</h5>
              </div>
              <form>
                <div class="modal-body">
                  <div class="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': !editingCharacter.name }"
                      v-model="editingCharacter.name"
                      required
                    />
                    <div class="invalid-feedback">
                      Character name is required
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Notes</label><br />
                    <textarea
                      class="form-control"
                      v-model="editingCharacter.note"
                      rows="10"
                    ></textarea>
                  </div>
                  <div class="form-group" v-if="editingCharacter.states?.length > 0">
                    <label>States</label><br />
                    <div class="character-states">
                      <div
                        class="character-state"
                        v-for="(state, index) in editingCharacter.states"
                        :key="index"
                      >
                        <div class="character-state-name">
                          <textarea
                            class="form-control"
                            row="1"
                            v-model="state.name"
                          >
                          </textarea>
                          <div class="character-state-error-message">
                            <template
                              v-if="
                                state.incompleteType ==
                                CharacterStateIncompleteType.NAME_TOO_LONG
                              "
                            >
                              Character length: {{ state.name.length }} / 500
                            </template>
                            <template v-else> &nbsp; </template>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger remove-state ms-2"
                          @click="removeCharacterState(editingCharacter, index)"
                          title="Delete state"
                        >
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  data-bs-dismiss="modal"
                  @click="cancelEditedCharacter"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  data-bs-dismiss="modal"
                  @click="saveEditedCharacter"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="row setup-content" id="step-3">
          <h5>
            We found {{ importedMatrix?.taxa?.size }} taxa in your matrix.
          </h5>
          <b>Please confirm that the taxa are correct.</b>
          <div class="matrix-confirmation-screen">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(taxon, index) in importedMatrix?.taxa?.values()">
                  <td>{{ index + 1 }}</td>
                  <td>
                    {{ taxon.extinct ? '†' : '' }}
                    {{ taxon.name }}
                    <p class="notes" v-if="taxon.note">
                      <b>Notes:</b>
                      <br />
                      <i v-html="convertNewlines(taxon.note)"></i>
                    </p>
                  </td>
                  <td>
                    <a
                      href="javascript:void(0);"
                      data-bs-toggle="modal"
                      data-bs-target="#taxonModal"
                      @click.stop.prevent="editTaxon(taxon)"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="btn-step-group">
            <button
              class="btn btn-primary btn-step-prev"
              type="button"
              @click="moveToCharacters"
            >
              Prev
            </button>
            <button
              class="btn btn-primary btn-step-next"
              type="button"
              :disabled="isUploading"
              @click="uploadMatrix"
            >
              <span
                v-if="isUploading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              <template v-if="route.query.merge === 'true'">
                {{ isUploading ? 'Merging...' : 'Merge' }}
              </template>
              <template v-else>
                {{ isUploading ? 'Uploading...' : 'Upload' }}
              </template>
            </button>
          </div>
        </div>
        
        <div class="modal" id="taxonModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Taxon</h5>
              </div>
              <form>
                <div class="modal-body">
                  <div class="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      class="form-control"
                      v-model="editingTaxon.name"
                    />
                  </div>
                  <div class="form-group">
                    <div class="form-check">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        id="extinct-checkbox"
                        v-model="editingTaxon.extinct"
                      />
                      <label class="form-check-label" for="extinct-checkbox">
                        Is Extinct
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Notes</label><br />
                    <textarea
                      class="form-control"
                      v-model="editingTaxon.note"
                      rows="10"
                    ></textarea>
                  </div>
                </div>
              </form>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  data-bs-dismiss="modal"
                  @click="cancelEditedTaxon"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  data-bs-dismiss="modal"
                  @click="saveEditedTaxon"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
<style scoped>
.form-group legend {
  float: none;
  font-size: inherit;
}

.stepwizard {
  margin: 10px;
}

.matrix-import-step p {
  color: #ef782f;
  font-size: 12px;
  margin-top: 10px;
}

.matrix-import-step-row {
  align-items: center;
  display: flex;
  position: relative;
}

.matrix-import-step-row hr {
  position: absolute;
  top: 0px;
  width: 100%;
  z-index: -1;
}

.matrix-import-step button[disabled] {
  filter: alpha(opacity=100) !important;
  opacity: 1 !important;
}

.matrix-import-step {
  flex: 1 1 0px;
  text-align: center;
}

.btn-circle {
  background-color: #fff;
  border: 1px #ef782f solid;
  border-radius: 15px;
  color: #ef782f;
  font-size: 12px;
  height: 30px;
  line-height: 1.428571429;
  padding: 6px 0;
  text-align: center;
  width: 30px;
}

.btn-circle:hover {
  border-color: #000;
  color: #000;
}

.btn-primary.btn-circle {
  background-color: #ef782f;
  color: #fff;
}

.btn-step-group {
  display: flex;
  flex: 1;
  margin-top: 15px;
  padding: 0;
}

.btn-step-next {
  flex-grow: 0;
  margin-left: auto;
  order: 2;
}

#step-2 {
  display: none;
}

#step-3 {
  display: none;
}

.flagged {
  color: red;
}

.incomplete-state-warning {
  color: red;
  font-style: italic;
}

.duplicate-characters {
  padding-top: 10px;
}

.matrix-confirmation-screen table {
  background-color: #fff;
  border: 1px solid #ccc;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
}

.matrix-confirmation-screen table .notes {
  padding: 5px;
}

div.matrix-confirmation-screen table th {
  background-color: #fff;
  border: 1px solid #ccc;
  font-size: 14px;
  font-weight: bold;
  text-align: left;
  vertical-align: top;
}

div.matrix-confirmation-screen table th:last-child {
  min-width: 50px;
}

div.matrix-confirmation-screen table tr:nth-child(odd) {
  background-color: #dedede;
}

div.matrix-confirmation-screen table td {
  padding: 3px;
  border: 1px solid #ccc;
  text-align: left;
  font-size: 12px;
  vertical-align: top;
}

.matrix-confirmation-screen table td ol {
  counter-reset: item -1;
  margin: 0;
}

.matrix-confirmation-screen table td li {
  display: block;
}

.matrix-confirmation-screen table td li.warning {
  color: red;
  font-weight: bold;
}

.matrix-confirmation-screen table td li::before {
  content: '(' counter(item) ') ';
  counter-increment: item;
  margin-left: -18px;
}

.character-states {
  display: flex;
  flex-direction: column;
}

.character-state {
  display: flex;
  flex-direction: row;
  padding-bottom: 3px;
}

.character-state-name {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.character-state-error-message {
  display: flex;
  flex-direction: row-reverse;
  font-style: italic;
  font-size: 0.75rem;
}

.character-states .remove-state {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: auto;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
  user-select: none;
  min-width: 28px;
  height: 28px;
  border-radius: 3px;
}

.character-states .remove-state:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.hidden-step {
  display: none !important;
}

.csv-upload-instructions {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.csv-upload-instructions p {
  margin-bottom: 10px;
}

.csv-upload-instructions p:last-child {
  margin-bottom: 0;
}
</style>
