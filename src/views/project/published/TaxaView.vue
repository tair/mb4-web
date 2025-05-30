<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const projectId = route.params.id
const taxaId = route.params.taxaId
const projectStore = usePublicProjectDetailsStore()

const filterByOptions = computed(() => {
  return projectStore.getTaxaFilterFields()
})
const defaultFilterByOption = computed(() => {
  return projectStore.getDefaultTaxaFilter()
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

const partitionByOptions = computed(() => {
  return projectStore.getTaxaPartitionFields()
})

const selectedPartitionByOption = ref('')

const selectedLetter = ref(null)
// default set to genus
let searchStr = ref(null)
let filterType = ref('All')

const letters = computed(() => {
  let uniqueLetters = null
  let filterBy = selectedFilterByOption.value
  uniqueLetters = projectStore.getFilteredTaxaInitials(filterBy)

  // when letters list change, change the selected letter to be the first letter available
  if (uniqueLetters) selectedLetter.value = uniqueLetters[0]
  return uniqueLetters
})

const filteredTaxa = computed(() => {
  return projectStore.getFilteredTaxa(
    filterType.value,
    selectedFilterByOption.value,
    selectedLetter.value,
    selectedPartitionByOption.value,
    searchStr.value
  )
})

const supraTaxa = computed(() => {
  return projectStore.getSupraTaxa()
})

const genusTaxa = computed(() => {
  return projectStore.getGenusTaxa()
})

function onFilterBy(type) {
  // type includes 'All', 'Search', 'Taxa', 'Partition'
  filterType.value = type
}

function onResetFilter() {
  selectedFilterByOption.value = defaultFilterByOption.value
  selectedPartitionByOption.value = ''
  selectedLetter.value = null
  onFilterBy('All')
}

function onClearSearchStr() {
  searchStr.value = ''
  onFilterBy('All')
}

function onSelectLetter(letter) {
  selectedLetter.value = letter
  onFilterBy('Taxa')
}

function getTaxonNameDisplay(taxonName, lookupFailed, pbdbVerified) {
  let display = taxonName
  if (lookupFailed) display += '<span class="highlight">*</span>'
  if (pbdbVerified) display += '<span class="highlight">#</span>'
  return display
}

onMounted(() => {
  projectStore.fetchProject(projectId)
  // Track taxa page view
  logView({ project_id: projectId, hit_type: HIT_TYPES.TAXA })
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.taxa_details ? null : 'No taxa data available.'"
    basePath="project"
  >
    <p>
      This project has
      {{ projectStore.taxa_details?.length }} taxa. Displaying
      {{ filteredTaxa?.length }} taxa.
    </p>
    <div class="mb-3">
      <div class="row mb-2">
        <div class="col-8 d-flex align-items-center">
          <label for="filter" class="me-2">Search for:</label>
          <input id="filter" v-model="searchStr" class="me-2" />
          <button @click="onFilterBy('Search')" class="btn btn-primary me-2">
            Submit
          </button>
          <button @click="onClearSearchStr()" class="btn btn-primary btn-white">
            Clear
          </button>
        </div>
        <div class="col-4 d-flex justify-content-end align-items-center">
          <button class="nav-link" @click="onResetFilter()">
            Show All Taxa
          </button>
        </div>
      </div>
      <p class="text-black-50 fw-bold">- OR -</p>
      <div class="filters-slim">
        <label for="filter-by" class="me-2">Browse by</label>
        <select
          id="filter-by"
          v-model="selectedFilterByOption"
          @change="onFilterBy('Taxa')"
          class="me-2"
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
      </div>
      <p class="text-black-50 fw-bold">- OR -</p>
      <div>
        <label for="patition-by" class="me-2"
          >Browse by taxa partition or matrix:</label
        >
        <select
          class="me-3"
          id="partition-by"
          v-model="selectedPartitionByOption"
          @change="onFilterBy('Partition')"
        >
          <option value="">- Select A Partition -</option>
          <option
            v-for="(label, key) in partitionByOptions"
            :key="key"
            :value="key"
          >
            {{ label }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="filterType == 'All'">
      <div id="supra-taxa" v-if="supraTaxa?.length > 0">
        <ul class="list-group">
          <li class="list-group-item">
            <h4>
              Supraspecific Taxa including those with no specified Linnaean Rank
            </h4>
          </li>
          <li
            :key="'supra-' + n"
            v-for="(taxa, n) in supraTaxa"
            :class="[
              n % 2 != 0 ? 'list-group-item-secondary' : '',
              'list-group-item',
            ]"
          >
            <span v-html="taxa.taxon_name" class="me-2"></span>
            <Tooltip :content="taxa.notes" v-if="taxa.notes"></Tooltip>
          </li>
        </ul>
      </div>
      <div id="genus-taxa" class="mt-2" v-if="genusTaxa?.length > 0">
        <ul class="list-group">
          <li class="list-group-item">
            <h4>
              Genus, Species, Subspecies, Scientific name author, Scientific
              name year
            </h4>
          </li>
          <li class="list-group-item">
            <p>
              <span class="highlight">*</span> indicates that a taxon has NOT
              matched to the <span class="highlight">NCBI</span> hierarchy.
              <br />
              <span class="highlight">#</span> indicates that a taxon has been
              matched to a PBDB entry.
            </p>
          </li>
          <li
            :key="'genus-' + n"
            v-for="(taxa, n) in genusTaxa"
            :class="[
              n % 2 != 0 ? 'list-group-item-secondary' : '',
              'list-group-item',
            ]"
          >
            <span
              v-html="
                getTaxonNameDisplay(
                  taxa.taxon_name,
                  taxa.lookup_failed,
                  taxa.pbdb_verified
                )
              "
              class="me-2"
            ></span>
            <Tooltip :content="taxa.notes" v-if="taxa.notes"></Tooltip>
          </li>
        </ul>
      </div>
    </div>
    <div v-else>
      <div class="fw-bold text-black-50">
        <div v-if="filterType == 'Taxa'" class="mb-2">
          Showing {{ filteredTaxa?.length }} taxa whose
          {{ filterByOptions[selectedFilterByOption] }} beginning with
          {{ selectedLetter }}.
        </div>
        <div v-if="filterType == 'Partition'" class="mb-2">
          Showing {{ filteredTaxa?.length }} taxa from
          {{ partitionByOptions[selectedPartitionByOption] }}.
        </div>
      </div>
      <div class="row">
        <ul class="list-group">
          <li class="list-group-item">
            <p>
              <span class="highlight">*</span> indicates that a taxon has NOT
              matched to the <span class="highlight">NCBI</span> hierarchy.
              <br />
              <span class="highlight">#</span> indicates that a taxon has been
              matched to a PBDB entry.
            </p>
          </li>
          <li
            :key="n"
            v-for="(taxa, n) in filteredTaxa"
            :class="[
              n % 2 != 0 ? 'list-group-item-secondary' : '',
              'list-group-item',
            ]"
          >
            <span
              v-html="
                getTaxonNameDisplay(
                  taxa.taxon_name,
                  taxa.lookup_failed,
                  taxa.pbdb_verified
                )
              "
              class="me-2"
            ></span>
            <Tooltip :content="taxa.notes" v-if="taxa.notes"></Tooltip>
          </li>
        </ul>
      </div>
    </div>
  </ProjectLoaderComp>
</template>

<style scoped>
:deep(.highlight) {
  color: #ef782f;
}
</style>
