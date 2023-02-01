<script setup>
import { useRoute } from 'vue-router'

import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { reactive } from 'vue'

const route = useRoute()
const projectId = route.params.id

let importedMatrix = reactive({})

async function uploadMatrix(event) {
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

function submit() {
  // TODO(kenzley): Convert to JSON and upload to the server.
}
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
        <form>
          <div class="row setup-content" id="step-1">
            <div class="form-group">
              <label for="matrix-title">Title</label>
              <input
                type="text"
                class="form-control"
                id="matrix-title"
                required="required"
              />
            </div>
            <div class="form-group">
              <label for="matrix-notes">Notes</label>
              <textarea class="form-control" id="matrix-notes"></textarea>
            </div>
            <div class="form-group">
              <label for="matrix-notes">Operational taxonomic unit</label>
              <select name="otu" class="form-control">
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
              <select name="published" class="form-control">
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
                  name="upload"
                  class="form-control"
                  @change="uploadMatrix"
                  required="required"
                />
              </div>
              <div class="form-group">
                <label for="matrix-notes"
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
              <button
                class="btn btn-primary btn-step-next"
                type="button"
                @click="moveToCharacters"
              >
                Next
              </button>
            </div>
          </div>
          <div class="row setup-content" id="step-2">
            <h5>
              We found {{ importedMatrix?.characters?.size }} characters in your
              matrix.
            </h5>
            <b
              >Please confirm that the character and their states are
              correct.</b
            >
            <div class="matrix-confirmation-screen">
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
                    <td>{{ character.characterNumber }}</td>
                    <td>
                      {{ character.name }}
                      <p class="notes" v-if="character.note">
                        <b>Notes:</b>
                        <br />
                        <i>{{ character.note }}</i>
                      </p>
                    </td>
                    <td>
                      <ol v-if="character.states">
                        <li v-for="states in character.states">
                          {{ states.name }}
                        </li>
                      </ol>
                    </td>
                    <td><i class="bi bi-pencil-square fa-m"></i>Edit</td>
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
                class="btn btn-primary btn-step-next"
                type="button"
                @click="moveToTaxa"
              >
                Next
              </button>
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
                      {{ taxon.name }}
                      <p class="notes" v-if="taxon.note">
                        <b>Notes:</b>
                        <br />
                        <i>{{ taxon.note }}</i>
                      </p>
                    </td>
                    <td><i class="bi bi-pencil-square fa-m"></i>Edit</td>
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
                @click="submit"
              >
                Submit
              </button>
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
  vertical-align: top;
  text-align: left;
  background-color: #fff;
  border: 1px solid #ccc;
  font-size: 14px;
  font-weight: bold;
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
</style>
