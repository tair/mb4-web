<script setup>
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { useCharactersStore } from '@/stores/CharactersStore'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { getIncompleteStateText } from '@/lib/matrix-parser/text.ts'
import { mergeMatrix } from '@/lib/MatrixMerger.js'
import { serializeMatrix } from '@/lib/MatrixSerializer.ts'
import router from '../../router'

const route = useRoute()
const taxaStore = useTaxaStore()
const matricesStore = useMatricesStore()
const charactersStore = useCharactersStore()
const projectId = route.params.id

const importedMatrix = reactive({})
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
    alert(
      `The data matrix you uploaded has at least ${character.maxScoredStatePosition} states for this character. Please define the missing one or update the data matrix and then reupload.`
    )
    return
  }
  character.states.splice(index, 1)
}

function saveEditedCharacter() {
  const characterNumber = editingCharacter.value.characterNumber
  const keys = Array.from(importedMatrix.characters.keys())
  const name = keys[characterNumber]
  const character = importedMatrix.characters.get(name)
  Object.assign(character, JSON.parse(JSON.stringify(editingCharacter.value)))
}

function confirmCharacter(character) {
  if (character.states) {
    for (const state of character.states) {
      if (state.name.match(/State\ \d+$/)) {
        alert(
          `You must rename the generic state: '${state.name}' or recode the character in the matrix.`
        )
        return
      }
      delete state.incompleteType
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
  const parser = await import('@/lib/matrix-parser/index.ts')
  const files = event.target?.files
  if (files == null || files.length == 0) {
    return
  }

  const file = files[0]
  const reader = new FileReader()

  reader.onload = function () {
    Object.assign(importedMatrix, parser.parseMatrixFile(reader.result))
  }

  reader.onerror = function () {
    alert('Failed to read file')
  }

  reader.readAsBinaryString(file)
}

function moveUpload() {
  moveToStep('step-1')
  return false
}

function moveToCharacters() {
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
  isUploading = true
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

    const file = document.getElementById('upload')
    formData.set('file', file.files[0])

    const serializedMatrix = serializeMatrix(importedMatrix)
    formData.set('matrix', serializedMatrix)

    const url = new URL(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/matrices/upload`
    )
    const response = await axios.post(url, formData)
    if (response.status != 200) {
      alert('There was an error importing the matrix')
      return
    }

    alert('Successfully imported')
    matricesStore.invalidate()
    router.push({ path: `/myprojects/${projectId}/matrices` })
  } finally {
    isUploading = false
  }
}

onMounted(() => {
  if (!taxaStore.isLoaded) {
    taxaStore.fetchTaxaByProjectId(projectId)
  }

  if (!charactersStore.isLoaded) {
    charactersStore.fetchCharactersByProjectId(projectId)
  }
})
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    basePath="myprojects"
    itemName="matrices"
  >
    <div class="nav-link mb-1 d-flex fw-bold small m-0 p-0 mb-3">
      <i class="bi bi-chevron-double-left me-1"></i>
      <a class="nav-link m-0 p-0" @click="$router.go(-1)">Back</a>
    </div>
    <div class="stepwizard">
      <div class="matrix-import-step-row setup-panel">
        <hr />
        <div class="matrix-import-step">
          <a href="#step-1" type="button" class="btn btn-primary btn-circle">
            1
          </a>
          <p>Import</p>
        </div>
        <div class="matrix-import-step">
          <a
            href="#step-2"
            type="button"
            class="btn btn-default btn-circle"
            disabled="disabled"
          >
            2
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
            3
          </a>
          <p>Taxa</p>
        </div>
      </div>
      <div>
        <form @submit.prevent="moveToCharacters">
          <div class="row setup-content" id="step-1">
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
                <option value="supraspecific_clade">Supraspecific Clade</option>
                <option value="higher_taxon_class">Class</option>
                <option value="higher_taxon_subclass">Subclass</option>
                <option value="higher_taxon_order">Order</option>
                <option value="higher_taxon_superfamily">Superfamily</option>
                <option value="higher_taxon_family">Family</option>
                <option value="higher_taxon_subfamily">Subfamily</option>
                <option value="genus" selected="selected">Genus</option>
                <option value="specific_epithet">Species</option>
                <option value="subspecific_epithet">Subspecies</option>
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
                this is a file with combined molecular and morphological data,
                or molecular data only, it must be submitted to the Documents
                area.
              </p>
              <div class="form-group">
                <label for="matrix-notes"
                  >NEXUS or TNT file to add to matrix</label
                >
                <input
                  type="file"
                  id="upload"
                  name="upload"
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
              <button class="btn btn-primary btn-step-prev" type="button">
                Cancel
              </button>
              <button class="btn btn-primary btn-step-next" type="submit">
                Next
              </button>
            </div>
          </div>
          <div class="row setup-content" id="step-2">
            <h5>
              We found {{ importedMatrix?.characters?.size }} characters in your
              matrix.
            </h5>

            <div
              v-if="Object.keys(duplicatedCharacters).length"
              class="duplicate-characters"
            >
              <span>
                Duplicate characters have been detected and renamed to
                distinguish them from the first instance of the following
                characters:
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
              Please review and (1) update the missing character state
              information on the screen, save your edits and click next or (2)
              update the data matrix file and reupload.
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
                        <i>{{ character.note }}</i>
                      </p>
                    </td>
                    <td>
                      <b v-if="character.type == 'C'">(continuous character)</b>
                      <b v-else-if="character.type == 'M'"
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

                      <a
                        :href="`#character${character.characterNumber}`"
                        @click.stop.prevent="confirmCharacter(character)"
                      >
                        Confirm
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
                        v-model="editingCharacter.name"
                      />
                    </div>
                    <div class="form-group">
                      <label>Notes</label><br />
                      <textarea
                        class="form-control"
                        v-model="editingCharacter.note"
                      ></textarea>
                    </div>
                    <div class="form-group">
                      <label>States</label><br />
                      <div>
                        <span
                          class="character-states"
                          v-for="(state, index) in editingCharacter.states"
                        >
                          <input
                            class="form-control"
                            type="text"
                            v-model="state.name"
                          />
                          <i
                            class="remove-state bi bi-x-lg"
                            @click="
                              removeCharacterState(editingCharacter, index)
                            "
                          ></i>
                        </span>
                      </div>
                    </div>
                  </div>
                </form>
                <div class="modal-footer">
                  <button
                    type="button"
                    class="btn btn-secondary"
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
                        <i>{{ taxon.note }}</i>
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
                Upload
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
                      <label>Is Extinct</label>
                      <input
                        type="checkbox"
                        class="form-check-input form-control"
                        v-model="editingTaxon.extinct"
                      />
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
                    class="btn btn-secondary"
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
  </ProjectContainerComp>
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
  padding-bottom: 5px;
}

.character-states .remove-state {
  color: #ef782f;
  margin: auto;
  padding: 0 4px;
}
</style>
