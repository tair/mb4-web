<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import SpecimenDetailsComp from '@/components/project/SpecimenDetailsComp.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id
const specimenId = route.params.specimenId
const projectStore = usePublicProjectDetailsStore()

const filterByOptions = computed(() => {
  return projectStore.getSpecimenFilterFields()
})

const defaultFilterByOption = computed(() => {
  return projectStore.getDefaultSpecimenFilter()
})
const selectedFilterByOption = ref(undefined)

// Watch for changes in defaultFilterByOption and update selectedFilterByOption accordingly
watch(
  defaultFilterByOption,
  (newVal) => {
    if (newVal !== undefined) {
      selectedFilterByOption.value = newVal
    }
  },
  { immediate: true }
) // immediate: true ensures the watcher runs immediately with the current value

const selectedLetter = ref(null)
// default set to genus
let selectAll = ref(true)

const letters = computed(() => {
  let uniqueLetters = null
  let filterBy = selectedFilterByOption.value
  uniqueLetters = projectStore.getFilteredSpecimenInitials(filterBy)

  // when letters list change, change the selected letter to be the first letter available
  if (uniqueLetters) selectedLetter.value = uniqueLetters[0]
  return uniqueLetters
})

const filteredSpecimens = computed(() => {
  return projectStore.getFilteredSpecimen(
    selectAll.value,
    selectedFilterByOption.value,
    selectedLetter.value
  )
})

function onSelectLetter(letter) {
  selectedLetter.value = letter
  selectAll.value = false
}

function onResetFilter() {
  selectedFilterByOption.value = defaultFilterByOption.value
  selectedLetter.value = null
  selectAll.value = true
}

let showUnidentified = ref(false)

const unidentifiedSpecimens = computed(() => {
  return projectStore.unidentified_specimen_details
})

const hasUnidentified = computed(() => {
  const specimens = unidentifiedSpecimens.value
  return specimens && specimens.length > 0
})

const getSpecimenCount = computed(() => {
  return (
    (projectStore.specimen_details?.length ?? 0) +
    (unidentifiedSpecimens.value?.length ?? 0)
  )
})

let isDetailsActive = ref(false)
const specimenDetailsFor = ref(null)
function onShowDetails(specimen_detail) {
  isDetailsActive.value = true
  specimenDetailsFor.value = specimen_detail
  // Track specimen view when a specific specimen is clicked
  if (projectId && specimen_detail.specimen_id) {
    logView({
      project_id: projectId,
      hit_type: HIT_TYPES.SPECIMEN,
      row_id: specimen_detail.specimen_id,
    })
  }
}

onMounted(() => {
  projectStore.fetchProject(projectId)
})

function getCleanTaxonName(specimenName) {
  // Strip HTML tags
  let cleanName = specimenName.replace(/<[^>]*>/g, '')
  // Remove extinct marker (†)
  cleanName = cleanName.replace(/†/g, '')
  
  // Check if this is an unidentified specimen (starts with parenthesis or has no taxon name)
  // Unidentified specimens will have format like "(institution/code:catalog)" or "(unvouchered)"
  const trimmed = cleanName.trim()
  if (trimmed.startsWith('(')) {
    // This is an unidentified specimen - return the reference info without outer parentheses
    return trimmed.replace(/^\(|\)$/g, '').trim()
  }
  
  // Identified specimen - remove specimen reference parts like (unvouchered) or (institution:catalog)
  cleanName = cleanName.replace(/\s*\([^)]*\)\s*$/g, '')
  // Remove author and year information (text after italicized name, including parentheses)
  // This handles patterns like "Homo erectus Darwin, 1859" or "Homo erectus (Darwin, 1859)"
  cleanName = cleanName.replace(/\s+\([^)]+,\s*\d{4}\)/g, '') // Remove (Author, Year)
  cleanName = cleanName.replace(/\s+[A-Z][a-z]+,\s*\d{4}/g, '') // Remove Author, Year
  
  return cleanName.trim()
}

function navigateToMediaWithSpecimen(specimenName) {
  const cleanName = getCleanTaxonName(specimenName)
  router.push({
    name: 'ProjectMediaView',
    params: { id: projectId },
    query: { search: cleanName }
  })
}
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.specimen_details ? null : 'No specimen data available.'
    "
    basePath="project"
  >
    <div class="row mb-3">
      <div class="row">
        <div class="col-8">
          <p v-if="!showUnidentified">
            This project has
            {{ getSpecimenCount }} specimens. Displaying
            {{ filteredSpecimens?.length }} identified specimens.
          </p>
          <p v-else>
            This project has
            {{ getSpecimenCount }} specimens. Displaying
            {{ unidentifiedSpecimens?.length }} unidentified specimens.
          </p>
        </div>
        <div class="col-4">
          <div class="text-end" v-if="hasUnidentified">
            <select id="showUnidentified" v-model="showUnidentified">
              <option :value="true">Show Unidentified Specimens</option>
              <option :value="false">Show Identified Specimens</option>
            </select>
          </div>
        </div>
      </div>

      <div class="filters text-black-50 fw-bold" v-if="!showUnidentified">
        Display specimens whose
        <select
          id="filter-by"
          v-model="selectedFilterByOption"
          @change="selectAll = false"
        >
          <option
            v-for="(label, key) in filterByOptions"
            :key="key"
            :value="key"
          >
            {{ label }}
          </option>
        </select>
        beginning with:
        <button
          :class="[{ active: selectedLetter == letter }, 'fw-bold']"
          v-for="letter in letters"
          :key="letter"
          @click="onSelectLetter(letter)"
        >
          {{ letter }}
        </button>
        <span v-if="letters && letters.length > 1">|</span>
        <button
          :class="[{ active: selectAll }, 'fw-bold']"
          @click="onResetFilter()"
        >
          ALL
        </button>
      </div>
    </div>
    <nav>
      <div class="nav nav-tabs" id="nav-tab" role="tablist">
        <a
          @click="isDetailsActive = false"
          :class="[{ active: isDetailsActive == false }, 'nav-link']"
          id="nav-specimen-list-tab"
          data-bs-toggle="tab"
          href="#nav-specimen-list"
          role="tab"
          aria-controls="nav-specimen-list"
          aria-selected="true"
          >Specimen list</a
        >
        <a
          @click="isDetailsActive = true"
          :class="[{ active: isDetailsActive == true }, 'nav-link']"
          id="nav-specimen-details-tab"
          data-bs-toggle="tab"
          href="#nav-specimen-details"
          role="tab"
          aria-controls="nav-specimen-details"
          aria-selected="false"
          >Specimen details</a
        >
      </div>
    </nav>
    <div class="tab-content" id="nav-tabContent">
      <div
        :class="[
          { active: !isDetailsActive },
          { show: !isDetailsActive },
          'tab-pane',
          'fade',
        ]"
        id="nav-specimen-list"
        role="tabpanel"
        aria-labelledby="nav-specimen-list-tab"
      >
        <ul class="list-group mt-2" v-if="!showUnidentified">
          <li
            :key="n"
            v-for="(specimen, n) in filteredSpecimens"
            :class="[
              n % 2 != 0 ? 'list-group-item-secondary' : '',
              'list-group-item',
            ]"
          >
            <a
              class="nav-link"
              href="#"
              @click="onShowDetails(specimen)"
              v-html="specimen.specimen_name"
            ></a>
            <span v-if="specimen.media_count > 0" class="ms-2 text-muted small">
              (<a
                href="#"
                @click.prevent="navigateToMediaWithSpecimen(specimen.specimen_name)"
                class="text-decoration-none"
              >
                {{ specimen.media_count }} media
              </a>)
            </span>
          </li>
        </ul>
        <ul class="list-group mt-2" v-else>
          <li
            :key="n"
            v-for="(specimen, n) in unidentifiedSpecimens"
            :class="[
              n % 2 != 0 ? 'list-group-item-secondary' : '',
              'list-group-item',
            ]"
          >
            <a
              class="nav-link"
              href="#"
              @click="onShowDetails(specimen)"
              v-html="specimen.specimen_name"
            ></a>
            <span v-if="specimen.media_count > 0" class="ms-2 text-muted small">
              (<a
                href="#"
                @click.prevent="navigateToMediaWithSpecimen(specimen.specimen_name)"
                class="text-decoration-none"
              >
                {{ specimen.media_count }} media
              </a>)
            </span>
          </li>
        </ul>
      </div>
      <div
        :class="[
          { active: isDetailsActive },
          { show: isDetailsActive },
          'tab-pane',
          'fade',
        ]"
        id="nav-specimen-details"
        role="tabpanel"
        aria-labelledby="nav-specimen-details-tab"
      >
        <SpecimenDetailsComp
          :specimen_detail="specimenDetailsFor"
        ></SpecimenDetailsComp>
      </div>
    </div>
  </ProjectLoaderComp>
</template>
