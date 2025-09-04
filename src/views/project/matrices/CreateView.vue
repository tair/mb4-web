<script setup>
import axios from 'axios'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCharactersStore } from '@/stores/CharactersStore'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useFileTransferStore } from '@/stores/FileTransferStore'
import { useNotifications } from '@/composables/useNotifications'
import { CharacterStateIncompleteType } from '@/lib/matrix-parser/MatrixObject.ts'
import { getIncompleteStateText } from '@/lib/matrix-parser/text.ts'
import { mergeMatrix } from '@/lib/MatrixMerger.js'
import { serializeMatrix } from '@/lib/MatrixSerializer.ts'
import { getTaxonomicUnitOptions } from '@/utils/taxa'
import router from '@/router'

const route = useRoute()
const taxaStore = useTaxaStore()
const matricesStore = useMatricesStore()
const charactersStore = useCharactersStore()
const fileTransferStore = useFileTransferStore()
const { showError, showSuccess } = useNotifications()
const projectId = route.params.id

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
  const parser = await import('@/lib/matrix-parser/parseMatrix.ts')
  const files = event.target?.files
  if (files == null || files.length == 0) {
    return
  }

  const file = files[0]
  const reader = new FileReader()
  reader.onload = function () {
    const matrixObject = parser.parseMatrix(reader.result)
    Object.assign(importedMatrix, matrixObject)
  }

  reader.onerror = function () {
    showError('Failed to read file')
  }

  reader.readAsBinaryString(file)
}

function moveUpload() {
  moveToStep('step-1')
  return false
}

async function moveToCharacters() {
  if (!importedMatrix.taxa || !importedMatrix.characters) {
    showError('Please upload a valid matrix file first')
    return false
  }

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
let uploadError = ref(null)

async function uploadMatrix() {
  isUploading.value = true
  uploadError.value = null

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
        uploadError.value =
          'Merge file not found. Please go back and select a file again.'
        return
      }
    } else {
      // For new matrix creation, require file upload
      const file = document.getElementById('upload')
      if (!file.files[0]) {
        uploadError.value = 'Please select a file to upload.'
        return
      }
      formData.set('file', file.files[0])
    }

    const serializedMatrix = serializeMatrix(importedMatrix)
    formData.set('matrix', serializedMatrix)

    const url = new URL(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/matrices/upload`
    )

    const response = await axios.post(url, formData, {
      timeout: 300000, // 5 minutes timeout
    })
    if (response.status === 200) {
      // Clear the file from FileTransferStore after successful upload
      if (isMerge) {
        fileTransferStore.clearMergeFile()
        sessionStorage.removeItem('matrixMergeData')
      }

      // Wait for store invalidation to complete
      await matricesStore.invalidate()

      // Force a full page reload to ensure fresh data is loaded
      window.location.href = `/myprojects/${projectId}/matrices`
    }
  } catch (error) {
    console.error('Error uploading matrix:', error)
    uploadError.value =
      error.response?.data?.message ||
      'Failed to upload matrix. Please try again.'
  } finally {
    isUploading.value = false
  }
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
              Upload an existing NEXUS or TNT file as the basis of your matrix
            </legend>
            <p>
              Note - your matrix must have character names for all the
              characters and these character names must each be different. If
              this is a file with combined molecular and morphological data, or
              molecular data only, it must be submitted to the Documents area.
            </p>
            <div class="form-group">
              <label for="matrix-notes"
                >NEXUS or TNT file to add to matrix</label
              >
              <input
                type="file"
                id="upload"
                name="upload"
                accept=".nex,.nexus,.tnt"
                class="form-control"
                @change="importMatrix"
                required="required"
              />
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
              :disabled="isUploading || isProcessingMatrix"
            >
              <span
                v-if="isProcessingMatrix"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{
                isProcessingMatrix
                  ? 'Processing...'
                  : isUploading
                  ? 'Uploading...'
                  : 'Next'
              }}
            </button>
          </div>
          <div v-if="uploadError" class="alert alert-danger mt-3" role="alert">
            {{ uploadError }}
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
                {{ characters.length }} characters named "{{ key }}".
                Duplicate{{ characters.length ? 's have' : ' has' }} been
                renamed to "{{
                  characters.slice(0, -1).join('", "') +
                  '", and "' +
                  characters.at(-1)
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
        <div v-if="uploadError" class="alert alert-danger mt-3" role="alert">
          {{ uploadError }}
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
</style>
