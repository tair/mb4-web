<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import {
  getViewStatsTooltipText,
  getDownloadTooltipText,
} from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import CustomModal from '@/components/project/CustomModal.vue'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const viewStatsTooltipText = getViewStatsTooltipText()
const downloadTooltipText = getDownloadTooltipText()
const cc0Img = '<img src="/images/CC-0_gray.png" />'
const copyRightTooltipText = `MorphoBank hosts phylogenetic data (matrices, characters, character states and documents) that are scientific facts in the public domain and not typically subject to copyright. Some authors have additionally marked their non-image data as CC0 ${cc0Img} to emphasize its availability for reuse.<br/><br/>Image data on MorphoBank may, however, be subject to copyright and licenses should be checked before reuse.`
const polymorphoricCellTooltipText =
  "You can find polymorphic scores by using the Search feature in the Matrix Editor. This is available as the 'Polymorphic' option in the Cell tab within the Search dialog."

const selectedMatrixDownloadOption = ref([])
const selectedCharListDownloadOption = ref([])

const showMatrixDownloadModal = ref([])
const showCharListDownloadModal = ref([])
const showOntologyDownloadModal = ref([])

// Watch for changes to projectStore.matrices
watch(
  () => projectStore.matrices,
  (newMatrices) => {
    if (newMatrices?.length) {
      selectedMatrixDownloadOption.value = Array(newMatrices.length).fill(
        'nexus_no_notes'
      )
      selectedCharListDownloadOption.value = Array(newMatrices.length).fill(
        'character_list'
      )
      showMatrixDownloadModal.value = Array(newMatrices.length).fill(false)
      showCharListDownloadModal.value = Array(newMatrices.length).fill(false)
      showOntologyDownloadModal.value = Array(newMatrices.length).fill(false)
    }
  },
  { immediate: true } // Runs the watcher immediately on component mount
)

function getMatrixUrl(matrixId) {
  return `/project/${projectId}/matrices/${matrixId}/view`
}

function getCountsMessage(counts) {
  if (!counts) return null
  const fields = {
    cell: 'scorings',
    taxa: 'taxa',
    character: 'characters',
    cell_media: 'cell images',
    media_label: 'labels attached to cell images',
    character_media: 'character images',
  }
  const messages = []
  for (const field in fields) {
    messages.push(`${counts[field] ?? 0} ${fields[field]}`)
  }
  return messages.join('; ')
}

function getHitMessage(hits, downloads) {
  const messages = []
  if (hits) messages.push(`Viewed ${hits} times`)
  if (downloads) messages.push(`Downloaded ${downloads} times`)
  return messages.join('; ')
}

function getDOILink(doi) {
  return `http://dx.doi.org/${doi}`
}

function hasContinuousChar(matrix) {
  return matrix.counts['continuous_character']
}

function hasPolymorphoricCell(matrix) {
  return matrix.counts['polymorphoric_cell']
}

function hasCharacterRule(matrix) {
  return matrix.counts['character_rule']
}

function getMatrixDownloadOptions(matrix, n) {
  if (hasContinuousChar(matrix)) {
    selectedMatrixDownloadOption.value[n] = 'tnt'
    return {
      tnt: 'TNT',
    }
  }
  return {
    nexus_no_notes: 'NEXUS w/o notes',
    nexus: 'NEXUS',
    nexml: 'NeXML',
    tnt: 'TNT',
  }
}

// TODO: ReCaptcha verification
function onDownloadMatrix(matrixId, n) {
  let format = ''
  let notes = '' // use empty value to represent 'false'
  switch (selectedMatrixDownloadOption.value[n]) {
    case 'tnt':
    case 'nexml':
    case 'nexus':
      format = selectedMatrixDownloadOption.value[n]
      notes = 'true'
      break
    case 'nexus_no_notes':
    default:
      format = 'nexus'
      break
  }
  const downloadUrl = projectStore.getMatrixDownloadLink(
    projectId,
    matrixId,
    format,
    notes
  )
  downloadFile(downloadUrl)
  showMatrixDownloadModal.value[n] = false
}

const charListDownloadOptions = {
  character_list: 'without character notes',
  character_list_notes: 'with character notes',
}

// TODO: ReCaptcha verification
function onDownloadCharList(matrixId, n) {
  let notes = '' // use empty value to represent 'false'
  switch (selectedCharListDownloadOption.value[n]) {
    case 'character_list_notes':
      notes = 'true'
      break
    case 'character_list':
    default:
      break
  }
  const downloadUrl = projectStore.getMatrixCharListDownloadLink(
    projectId,
    matrixId,
    notes
  )
  downloadFile(downloadUrl)
  showCharListDownloadModal.value[n] = false
}

// TODO: ReCaptcha verification
function onDownloadOntology(matrixId, n) {
  const downloadUrl = projectStore.getMatrixOntologyDownloadLink(
    projectId,
    matrixId
  )
  downloadFile(downloadUrl)
  showOntologyDownloadModal.value[n] = false
}

function downloadFile(downloadUrl) {
  const link = document.createElement('a')
  link.style.display = 'none'
  document.body.appendChild(link)

  link.href = downloadUrl
  link.click()

  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(link)
}

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.matrices ? null : 'No matrix data available.'"
    basePath="project"
  >
    <p>
      This project has
      {{ projectStore.matrices?.length }}
      {{
        projectStore.matrices?.length && projectStore.matrices?.length > 1
          ? 'matrices'
          : 'matrix'
      }}.
    </p>
    <div
      :key="n"
      v-for="(matrix, n) in projectStore.matrices"
      class="card p-4 mt-2"
    >
      <div class="header-row">
        <span class="fw-bold">{{ matrix.title }}</span>
        <router-link
          :to="getMatrixUrl(matrix.matrix_id)"
          tag="a"
          target="_blank"
        >
          <button class="btn btn-primary">View matrix</button>
        </router-link>
      </div>
      <div class="mt-3">
        <p>{{ getCountsMessage(matrix.counts) }}</p>
        <div class="row">
          <div class="col-10">
            <p>
              {{ getHitMessage(matrix.hits, matrix.downloads) }}
              <Tooltip :content="viewStatsTooltipText"></Tooltip>
            </p>
            <p v-if="matrix.doi">
              Matrix doi: {{ matrix.doi }},
              <a :href="getDOILink(matrix.doi)" target="_blank">{{
                getDOILink(matrix.doi)
              }}</a>
            </p>
          </div>
          <div class="col-2" v-if="projectStore.overview?.publish_cc0">
            <Tooltip
              :content="copyRightTooltipText"
              :displayStyle="'image'"
              :displayContent="cc0Img"
            ></Tooltip>
          </div>
        </div>
      </div>
      <hr />
      <div>
        <p class="fw-bold">Download options</p>
        <p>
          Download entire matrix as
          <select
            id="download-matrix"
            v-model="selectedMatrixDownloadOption[n]"
            class="me-2"
          >
            <option
              v-for="(label, key) in getMatrixDownloadOptions(matrix, n)"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
          format
          <Tooltip :content="downloadTooltipText"></Tooltip>
          <button
            @click="showMatrixDownloadModal[n] = true"
            class="btn btn-primary ms-2"
          >
            Download Matrix
          </button>
          <CustomModal
            :isVisible="showMatrixDownloadModal[n]"
            @close="showMatrixDownloadModal[n] = false"
          >
            <div>
              <h2>Copyright Notice</h2>
              <p v-html="copyRightTooltipText"></p>
              <button
                class="btn btn-primary"
                @click="onDownloadMatrix(matrix.matrix_id, n)"
              >
                I Acknowledge and Proceed
              </button>
            </div>
          </CustomModal>
        </p>
        <p v-if="hasContinuousChar(matrix)" class="fst-italic">
          NEXUS-format downloads are unavailable for this matrix because it
          contains continuous characters
        </p>
        <p v-if="hasPolymorphoricCell(matrix)" class="fst-italic fw-bold">
          This matrix contains polymorphic scores for '-' and another state,
          e.g., (-,1). Thus, this matrix will not load in Mesquite.
          <Tooltip :content="polymorphoricCellTooltipText"></Tooltip>
        </p>
        <p>
          Download character list
          <select
            id="download-char-list"
            v-model="selectedCharListDownloadOption[n]"
            class="me-2"
          >
            <option
              v-for="(label, key) in charListDownloadOptions"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
          format
          <Tooltip :content="downloadTooltipText"></Tooltip>
          <button
            @click="showCharListDownloadModal[n] = true"
            class="btn btn-primary ms-2"
          >
            Download Character List
          </button>
          <CustomModal
            :isVisible="showCharListDownloadModal[n]"
            @close="showCharListDownloadModal[n] = false"
          >
            <div>
              <h2>Copyright Notice</h2>
              <p v-html="copyRightTooltipText"></p>
              <button
                class="btn btn-primary"
                @click="onDownloadCharList(matrix.matrix_id, n)"
              >
                I Acknowledge and Proceed
              </button>
            </div>
          </CustomModal>
        </p>
        <p v-if="hasCharacterRule(matrix)" class="fst-italic">
          <button
            @click="showOntologyDownloadModal[n] = true"
            class="btn btn-primary"
          >
            >> Download Ontology >>
          </button>
          <CustomModal
            :isVisible="showOntologyDownloadModal[n]"
            @close="showOntologyDownloadModal[n] = false"
          >
            <div>
              <h2>Copyright Notice</h2>
              <p v-html="copyRightTooltipText"></p>
              <button
                class="btn btn-primary"
                @click="onDownloadOntology(matrix.matrix_id, n)"
              >
                I Acknowledge and Proceed
              </button>
            </div>
          </CustomModal>
        </p>
      </div>
    </div>
  </ProjectLoaderComp>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
