<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id
const taxaId = route.params.taxaId
const projectStore = usePublicProjectDetailsStore()
const mediaStore = usePublicMediaStore()

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

// Helper function to normalize taxon name for matching
function normalizeTaxonName(name) {
  if (!name) return ''
  // Strip HTML tags, extinct marker, and trim
  return name.replace(/<[^>]*>/g, '').replace(/†/g, '').trim().toLowerCase()
}

// Compute media counts for each taxon by matching taxon_name
const taxonMediaCounts = computed(() => {
  if (!mediaStore.full_media_files) return {}
  
  const counts = {}
  for (const media of mediaStore.full_media_files) {
    if (media.taxon_name) {
      const normalizedName = normalizeTaxonName(media.taxon_name)
      if (normalizedName) {
        counts[normalizedName] = (counts[normalizedName] || 0) + 1
      }
    }
  }
  return counts
})

// Helper function to get media count for a taxon
function getMediaCountForTaxon(taxon) {
  const normalizedName = normalizeTaxonName(taxon.taxon_name)
  return taxonMediaCounts.value[normalizedName] || 0
}

const filteredTaxa = computed(() => {
  const taxa = projectStore.getFilteredTaxa(
    filterType.value,
    selectedFilterByOption.value,
    selectedLetter.value,
    selectedPartitionByOption.value,
    searchStr.value
  )
  
  if (!taxa) return null
  
  // Add media counts to each taxon
  return taxa.map(taxon => ({
    ...taxon,
    media_count: getMediaCountForTaxon(taxon)
  }))
})

const supraTaxa = computed(() => {
  const taxa = projectStore.getSupraTaxa()
  
  if (!taxa) return null
  
  // Add media counts to each taxon
  return taxa.map(taxon => ({
    ...taxon,
    media_count: getMediaCountForTaxon(taxon)
  }))
})

const genusTaxa = computed(() => {
  const taxa = projectStore.getGenusTaxa()
  
  if (!taxa) return null
  
  // Add media counts to each taxon
  return taxa.map(taxon => ({
    ...taxon,
    media_count: getMediaCountForTaxon(taxon)
  }))
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

function getCleanTaxonName(taxonName) {
  // Strip HTML tags
  let cleanName = taxonName.replace(/<[^>]*>/g, '')
  // Remove extinct marker (†)
  cleanName = cleanName.replace(/†/g, '')
  // Remove author and year information
  cleanName = cleanName.replace(/\s+\([^)]+,\s*\d{4}\)/g, '') // Remove (Author, Year)
  cleanName = cleanName.replace(/\s+[A-Z][a-z]+,\s*\d{4}/g, '') // Remove Author, Year
  
  return cleanName.trim()
}

function navigateToMediaWithTaxon(taxonName) {
  const cleanName = getCleanTaxonName(taxonName)
  router.push({
    name: 'ProjectMediaView',
    params: { id: projectId },
    query: { search: cleanName }
  })
}

onMounted(async () => {
  await projectStore.fetchProject(projectId)
  // Load media files to calculate media counts
  await mediaStore.fetchMediaFiles(projectId)
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
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span v-html="taxa.taxon_name" class="me-2"></span>
              <span v-if="taxa.media_count > 0" class="text-muted small" style="white-space: nowrap;">
                (<a
                  href="#"
                  @click.prevent="navigateToMediaWithTaxon(taxa.taxon_name)"
                  class="text-decoration-none"
                >
                  {{ taxa.media_count }} media
                </a>)
              </span>
              <Tooltip :content="taxa.notes" v-if="taxa.notes"></Tooltip>
            </div>
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
            <div style="display: flex; align-items: baseline; gap: 8px;">
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
              <span v-if="taxa.media_count > 0" class="text-muted small" style="white-space: nowrap;">
                (<a
                  href="#"
                  @click.prevent="navigateToMediaWithTaxon(taxa.taxon_name)"
                  class="text-decoration-none"
                >
                  {{ taxa.media_count }} media
                </a>)
              </span>
              <Tooltip :content="taxa.notes" v-if="taxa.notes"></Tooltip>
            </div>
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
            <div style="display: flex; align-items: baseline; gap: 8px;">
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
              <span v-if="taxa.media_count > 0" class="text-muted small" style="white-space: nowrap;">
                (<a
                  href="#"
                  @click.prevent="navigateToMediaWithTaxon(taxa.taxon_name)"
                  class="text-decoration-none"
                >
                  {{ taxa.media_count }} media
                </a>)
              </span>
              <Tooltip :content="taxa.notes" v-if="taxa.notes"></Tooltip>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </ProjectLoaderComp>
</template>

<style scoped>
:deep(.highlight) {
  color: var(--theme-orange);
}
</style>
