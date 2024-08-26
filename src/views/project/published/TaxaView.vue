<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import Tooltip from '@/components/main/Tooltip.vue'

const route = useRoute()
const projectId = route.params.id
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

const defaultPartitionByField = computed(() => {
  return projectStore.getDefaultTaxaPartitionField()
})

const selectedPartitionByOption = ref(null)
let selectPartition = ref(false)

watch(
  defaultPartitionByField,
  (newVal) => {
    if (newVal !== undefined) {
      selectedPartitionByOption.value = newVal
    }
  },
  { immediate: true }
)

const selectedLetter = ref(null)
// default set to genus
let selectAll = ref(true)
let searchStr = ref(null)

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
    selectAll.value,
    selectedFilterByOption.value,
    selectedLetter.value,
    selectPartition.value,
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

function onResetFilter() {
  selectedFilterByOption.value = defaultFilterByOption.value
  selectedPartitionByOption.value = defaultPartitionByField.value
  selectedLetter.value = null
  selectAll.value = true
  selectPartition.value = false
}

function getTaxonNameDisplay(taxonName, lookupFailed, pbdbVerified) {
  let display = taxonName
  if (lookupFailed) display += '<span class="highlight">*</span>'
  if (pbdbVerified) display += '<span class="highlight">#</span>'
  return display
}

onMounted(() => {
  projectStore.fetchProject(projectId)
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
      <div class="mb-2">
        <label for="filter" class="me-2">Search for:</label>
        <input
          id="filter"
          v-model="searchStr"
          class="me-2"
          @input="selectAll = false"
        />
        <button
          @click="
            searchStr = ''
            selectAll = true
          "
          class="btn btn-primary btn-white"
        >
          clear
        </button>
      </div>
      <div class="row">
        <div class="col-5">
          <label for="filter-by" class="me-2">Browse by:</label>
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
        </div>
        <div class="col-7 text-end">
          <label for="patition-by" class="me-2"
            >Show by taxa partition or matrix:</label
          >
          <select
            class="me-3"
            id="partition-by"
            v-model="selectedPartitionByOption"
            @change="
              selectPartition = true
              selectAll = false
            "
          >
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
    </div>
    <div class="filters text-black-50 fw-bold">
      <div>
        Display taxa beginning with:
        <button
          :class="[{ active: selectedLetter == letter }, 'fw-bold']"
          v-for="letter in letters"
          :key="letter"
          @click="
            selectedLetter = letter
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
    <div v-if="selectAll">
      <div id="supra-taxa">
        <ul class="list-group">
          <li class="list-group-item">
            <h4>
              Supraspecific Taxa including those with no specified Linnaean Rank
            </h4>
          </li>
          <li
            :key="'supra-' + n"
            v-for="(taxa, n) in supraTaxa"
            class="list-group-item"
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
      <div id="genus-taxa" class="mt-2">
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
            class="list-group-item"
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
      <div v-if="selectPartition" class="mb-2">
        Showing {{ filteredTaxa?.length }} taxa from
        {{ partitionByOptions[selectedPartitionByOption] }}.
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
            class="list-group-item"
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
::v-deep .highlight {
  color: #ef782f;
}
</style>
