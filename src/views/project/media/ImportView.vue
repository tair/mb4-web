<script setup lang="ts">
import router from '@/router'
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { TaxaColumns, getTaxonName } from '@/utils/taxa'
import { Filter } from '@/types/most'
import { toISODate } from '@/utils/date'

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
const filteredTaxa = computed(() =>
  Object.values(filters)
    .reduce((taxa, filter) => taxa.filter(filter), taxaStore.taxa)
    .sort((a, b) => {
      const nameA = getTaxonName(a, TaxaColumns.GENUS, false)
      if (!nameA) {
        return -1
      }

      const nameB = getTaxonName(b, TaxaColumns.GENUS, false)
      if (!nameB) {
        return -1
      }

      return nameA.localeCompare(nameB)
    })
)

const isLoaded = computed(() => taxaStore.isLoaded)
const hasNoResult = computed(() =>
  Array.from(importResults.value.values()).some((v) => v.no_results_on > 0)
)
const importResults = ref<Map<number, ImportInfo>>(
  new Map<number, ImportInfo>()
)
const mediaResults = ref<Map<number, ImportResult>>(
  new Map<number, ImportResult>()
)

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
  let total = 0
  for (const taxon of taxaStore.taxa) {
    const taxonId = taxon.taxon_id
    const importResult = importResults.value.get(taxonId)
    if (importResult.no_results_on > 0) {
      taxon.selected = true
      if (++total >= 100) {
        break
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

async function fecthMediaForSelectedTaxa() {
  const selectedTaxaIds = taxaStore.taxa
    .filter((taxon) => taxon.selected)
    .map((taxon) => taxon.taxon_id)
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

  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/projects/${projectId}/${importType}/media`,
    { taxon_ids: selectedTaxaIds }
  )

  if (response.status != 200) {
    alert('Failed to fetch taxa')
    return
  }

  mediaResults.value.clear()
  for (const result of response.data.results) {
    const taxonId = parseInt(result.taxon_id)
    mediaResults.value.set(taxonId, result)
  }

  moveToStep('step-2')
  return false
}

async function fetchMoreMedia(taxonId: number) {
  const results = mediaResults.value.get(taxonId)
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/projects/${projectId}/${importType}/media`,
    { taxon_ids: [taxonId], size: results.media.length + 9 }
  )

  if (response.status != 200) {
    alert('Failed to fetch more media')
    return
  }

  for (const result of response.data.results) {
    mediaResults.value.set(taxonId, result)
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
  }

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
    alert('Failed to import media: ' + response.data.message ?? 'Unknown issue')
    return
  }

  // Clear the import list and media results since media have been imported
  // thus these are invalidated.
  mediaResults.value.clear()
  importResults.value.clear()

  alert(
    'You have successfully imported the media into Morphobank but you curate them before they can be released into your import.'
  )
  router.push({ path: `/myprojects/${projectId}/media/curate` })
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
            <div v-if="taxaStore.taxa.length > 100">
              <button type="button" @click="selectFirst100">
                Select first 100
              </button>
            </div>
            <div v-else>
              <button type="button" @click="selectAll">Select all</button>
            </div>
            <div v-if="hasNoResult">
              <button type="button" @click="selectNoResult">
                Select records with no results
              </button>
              <Tooltip
                :content="`Use this to search ${importText} again since their database is constantly being updated (Only first 100 will be selected)`"
              >
              </Tooltip>
            </div>
            <div>
              <button type="button" @click="unselectAll">Unselect all</button>
            </div>
            <div>
              Use the checkboxes to indicate which taxa you would like to search
              for on {{ importText }}. You will be presented image results to
              selectively import for use as
              <b>taxon exemplars</b>
              <Tooltip
                content="Taxon exemplars appear in matrices to illustrate a taxon"
              />. Unvouchered specimens will be created for these new media
              files if they are not already available for the taxon.
              <br />
              <i>
                Taxa for which Media have already been imported from
                {{ importText }} will appear gray.
              </i>
            </div>
            <div class="grid">
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
                  <TaxonomicName
                    :class="{
                      greyed:
                        importResults.get(taxon.taxon_id)?.no_results_on ||
                        importResults.get(taxon.taxon_id)?.set_on,
                    }"
                    :showExtinctMarker="true"
                    :taxon="taxon"
                  />
                  <span
                    v-if="importResults.get(taxon.taxon_id)?.set_on"
                    class="already-imported"
                  >
                    already imported
                  </span>
                  <span
                    v-else-if="importResults.get(taxon.taxon_id)?.no_results_on"
                    class="no-results"
                  >
                    no results ({{
                      toISODate(
                        importResults.get(taxon.taxon_id)?.no_results_on
                      )
                    }})
                  </span>
                </label>
              </div>
            </div>
            <div class="btn-step-group">
              <button
                type="button"
                class="btn btn-primary btn-step-prev"
                @click="$router.go(-1)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary btn-step-next"
                @click="fecthMediaForSelectedTaxa"
              >
                Next
              </button>
            </div>
          </div>
          <div class="row setup-content" id="step-2">
            <div v-if="mediaResults.size > 0">
              <div>
                <button type="button" @click="selectAllForImport(true, false)">
                  Select all for import
                </button>
                <button type="button" @click="selectAllForImport(true, true)">
                  Select all for import/exemplar
                </button>
                <button type="button" @click="selectAllForImport(false, false)">
                  Deselect all
                </button>
              </div>
              <div
                v-for="[taxonId, results] in mediaResults"
                :key="taxonId"
                class="grid-item"
              >
                <ImportMediaComponent
                  :taxon="taxaStore.getTaxonById(taxonId)"
                  :importText="importText"
                  :results="results"
                  :fetchMoreMedia="() => fetchMoreMedia(taxonId)"
                />
              </div>
            </div>
            <div v-else>No results from {{ importText }}</div>
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
              >
                Import
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
</style>
