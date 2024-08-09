<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import SpecimenDetailsComp from '@/components/project/SpecimenDetailsComp.vue'

const route = useRoute()
const projectId = route.params.id
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

let isDetailsActive = ref(false)
const specimenDetailsFor = ref(null)
function onShowDetails(specimen_detail) {
  isDetailsActive.value = true
  specimenDetailsFor.value = specimen_detail
}

onMounted(() => {
  projectStore.fetchProject(projectId)
})
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
      <p>
        This project has
        {{ projectStore.specimen_details?.length }} specimens. Displaying
        {{ filteredSpecimens?.length }} specimens.
      </p>

      <div
        class="mb-3 text-end nav-link"
        @click="showUnidentified = !showUnidentified"
        v-if="hasUnidentified"
      >
        {{
          showUnidentified
            ? 'Show Identified Specimens'
            : 'Show Unidentified Specimens'
        }}
      </div>

      <div class="filters text-black-50 fw-bold" v-if="!showUnidentified">
        Display specimens whose
        <select
          id="filter-by"
          v-model="selectedFilterByOption"
          @change="selectAll = false"
        >
          <option
            v-for="(value, label) in filterByOptions"
            :key="value"
            :value="value"
          >
            {{ label }}
          </option>
        </select>
        beginning with:
        <button
          :class="[{ active: selectedLetter == letter }, 'fw-bold']"
          v-for="letter in letters"
          :key="letter"
          @click="
            selectedLetter = letter;
            selectAll = false
          "
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
            class="list-group-item"
          >
            <a
              class="nav-link"
              href="#"
              @click="onShowDetails(specimen)"
              v-html="specimen.specimen_name"
            ></a>
          </li>
        </ul>
        <ul class="list-group mt-2" v-else>
          <li
            :key="n"
            v-for="(specimen, n) in unidentifiedSpecimens"
            class="list-group-item"
          >
            <a
              class="nav-link"
              href="#"
              @click="onShowDetails(specimen)"
              v-html="specimen.specimen_name"
            ></a>
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
