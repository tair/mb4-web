<script setup>
import { useRoute } from 'vue-router'
import router from '@/router'
import { computed, onMounted, reactive, ref } from 'vue'
import { useTaxaStore } from '@/stores/TaxaStore'
import EditBatchDialog from '@/views/project/taxa/EditBatchDialog.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import DeleteDialog from '@/views/project/taxa/DeleteDialog.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import {
  TAXA_COLUMN_NAMES,
  TaxaColumns,
  nameColumnMap,
  sortTaxaAlphabetically,
} from '@/utils/taxa'

const route = useRoute()
const projectId = route.params.id

const taxaToDelete = ref([])

const taxaStore = useTaxaStore()
const isLoaded = computed(() => taxaStore.isLoaded)

const rank = ref(TaxaColumns.GENUS)
const selectedLetter = ref(null)
const searchStr = ref('')

const letters = computed(() => {
  const letters = new Set()
  for (const taxon of taxaStore.taxa) {
    const index = rank.value
    if (taxon[index] && taxon[index].length > 0) {
      const firstLetter = taxon[index][0]
      if (firstLetter) {
        letters.add(firstLetter.toUpperCase())
      }
    }
  }
  return [...letters].sort()
})

const filters = reactive({})
const filteredTaxa = computed(() => {
  // Start with either search results or all taxa
  let baseTaxa = searchStr.value.trim()
    ? taxaStore.searchTaxa(searchStr.value)
    : taxaStore.taxa

  // Apply other filters (group, page/letter filters)
  const filtered = Object.values(filters).reduce(
    (taxa, filter) => taxa.filter(filter),
    baseTaxa
  )

  return sortTaxaAlphabetically(filtered, TaxaColumns.GENUS)
})

const availableRanks = computed(() => {
  const ranks = new Set()
  for (const taxon of taxaStore.taxa) {
    for (const columnName of TAXA_COLUMN_NAMES)
      if (columnName in taxon && taxon[columnName]?.length > 0) {
        ranks.add(columnName)
      }
  }
  return ranks
})

const allSelected = computed({
  get: function () {
    return filteredTaxa.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredTaxa.value.forEach((b) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() => filteredTaxa.value.some((b) => b.selected))

onMounted(() => {
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
})

async function batchEdit(json) {
  const taxaIds = filteredTaxa.value
    .filter((t) => t.selected)
    .map((t) => t.taxon_id)
  return taxaStore.editIds(projectId, taxaIds, json)
}

function refresh() {
  taxaStore.fetch(projectId)
}

function onSearch() {
  // console.log('onSearch', searchStr.value)
}

function onClearSearch() {
  searchStr.value = ''
}

const selectedGroup = ref({})
const selectedGroupName = ref(null)
function setGroup(event) {
  const id = event.target.value
  const label = event.target.selectedOptions[0].parentElement.label
  selectedGroup.value = { label, id }

  if (label == 'Partition') {
    const partition = taxaStore.partitions.find((p) => p.partition_id == id)
    if (partition) {
      selectedGroupName.value = 'partition: ' + partition.name
      filters['group'] = (taxon) => {
        return partition.taxon_ids.includes(taxon.taxon_id)
      }
    }
  } else if (label == 'Matrix') {
    const matrix = taxaStore.matrices.find((m) => m.matrix_id == id)
    if (matrix) {
      selectedGroupName.value = 'matrix: ' + matrix.title
      filters['group'] = (taxon) => {
        return matrix.taxon_ids.includes(taxon.taxon_id)
      }
    }
  } else {
    delete filters['group']
    selectedGroupName.value = null
  }
}

function setPage(event) {
  const text = event.target.textContent
  if (text == 'ALL') {
    selectedLetter.value = null
    delete filters['page']
    return
  }

  selectedLetter.value = text
  const index = rank.value
  filters['page'] = (taxon) => {
    if (taxon[index] && taxon[index].length > 0) {
      const firstLetter = taxon[index][0].toUpperCase()
      return firstLetter == text
    }
    return false
  }
}

function setRank() {
  delete filters['page']
  selectedLetter.value = null
}

function clearSearch() {
  for (const key in filters) {
    delete filters[key]
  }

  selectedLetter.value = null
  rank.value = TaxaColumns.GENUS
  selectedGroup.value = {}
  selectedGroupName.value = null
  searchStr.value = ''
}

function validateSelectedTaxaAtPbdb() {
  const selectedTaxaIds = filteredTaxa.value
    .filter((t) => t.selected)
    .map((t) => t.taxon_id)

  if (selectedTaxaIds.length === 0) {
    alert('Please select at least one taxon to validate.')
    return
  }

  if (selectedTaxaIds.length > 100) {
    alert('You can only validate up to 100 taxa at a time. Please select fewer taxa.')
    return
  }

  // Store selected taxa IDs in sessionStorage for the PBDB wizard to access
  sessionStorage.setItem('pbdb-preselected-taxa', JSON.stringify(selectedTaxaIds))

  // Navigate to PBDB import view
  router.push({ path: `/myprojects/${projectId}/taxa/pbdb/import` })
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ taxaStore.taxa?.length }} taxa associated with this project.
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/taxa/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Create Taxon</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/taxa/create/batch`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Batch Create</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/taxa/upload`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-file-arrow-up"></i>
          <span> Import File</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/taxa/extinct/edit`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <span class="extinct-icon">†</span>
          <span> Edit Extinct Taxa</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/taxa/pbdb/import`">
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          title="Validate taxa at the PBDB"
        >
          <i class="fa-solid fa-check-circle"></i>
          <span> Validate taxa</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa fa-file-arrow-up"></i>
          <span> Import Media </span>
        </button>
        <div class="dropdown-menu">
          <RouterLink :to="`/myprojects/${projectId}/media/import/eol`">
            <button type="button" class="dropdown-item">Import from EOL</button>
          </RouterLink>
          <RouterLink :to="`/myprojects/${projectId}/media/import/idigbio`">
            <button type="button" class="dropdown-item">
              Import from iDigBio
            </button>
          </RouterLink>
        </div>
      </div>
    </div>
    <div v-if="taxaStore.taxa?.length">
      <div class="mb-3">
        <div class="row mb-2">
          <div class="col-8 d-flex align-items-center">
            <label for="filter" class="me-2"
              >Search for
              <Tooltip
                content="This search feature will retrieve taxa within your project only"
              ></Tooltip>
              :</label
            >
            <input id="filter" v-model="searchStr" class="me-2" />
            <button @click="onSearch" class="btn btn-primary me-2">
              Submit
            </button>
            <button
              @click="onClearSearch"
              class="btn btn-primary btn-white me-2"
            >
              Clear
            </button>
          </div>
          <div class="col-4 d-flex justify-content-end align-items-center">
            <button class="nav-link" @click="clearSearch">Show All Taxa</button>
          </div>
        </div>
      </div>
      <p class="text-black-50 fw-bold">- OR -</p>
      <div class="filters-slim" v-if="availableRanks.size > 0">
        <label for="filter-by" class="me-2">Browse by</label>
        <select id="filter-by" v-model="rank" @change="setRank" class="me-2">
          <template v-for="[column, name] in nameColumnMap">
            <option v-if="availableRanks.has(column)" :value="column">
              {{ name }}
            </option>
          </template>
        </select>
        beginning with:
        <button
          :class="[{ active: selectedLetter == letter }, 'fw-bold']"
          v-for="letter in letters"
          :key="letter"
          @click="setPage"
        >
          {{ letter }}
        </button>
        <span class="separator">|</span>
        <button
          :class="[{ active: selectedLetter == null }, 'fw-bold']"
          @click="setPage"
        >
          ALL
        </button>
      </div>
      <p
        class="text-black-50 fw-bold"
        v-if="taxaStore.partitions.length > 0 || taxaStore.matrices.length > 0"
      >
        - OR -
      </p>
      <div
        v-if="taxaStore.partitions.length > 0 || taxaStore.matrices.length > 0"
      >
        <label for="partition-by" class="me-2"
          >Browse by taxa partition or matrix:</label
        >
        <select class="me-3" id="partition-by" @change="setGroup">
          <option value="0">- Select A Partition -</option>
          <optgroup label="Partition">
            <template v-for="partition in taxaStore.partitions">
              <option
                :value="partition.partition_id"
                :selected="selectedGroup.id == partition.partition_id"
              >
                {{ partition.name }}
              </option>
            </template>
          </optgroup>
          <optgroup label="Matrix">
            <template v-for="matrix in taxaStore.matrices">
              <option
                :value="matrix.matrix_id"
                :selected="selectedGroup.id == matrix.matrix_id"
              >
                {{ matrix.title }}
              </option>
            </template>
          </optgroup>
        </select>
      </div>
      <div class="row mt-3 fw-bold text-black-50">
        <div class="col-8">
          <div v-if="selectedGroupName && selectedLetter != null">
            <p>
              Displaying {{ filteredTaxa?.length }} taxonomic names from
              <i>{{ selectedGroupName }}</i> where
              {{ nameColumnMap.get(rank) }} starts with '{{ selectedLetter }}'.
            </p>
          </div>
          <div v-else-if="selectedGroupName">
            <p>
              Displaying {{ filteredTaxa?.length }} taxonomic names from
              <i>{{ selectedGroupName }}</i
              >.
            </p>
          </div>
          <div v-else-if="selectedLetter != null">
            <p>
              Displaying {{ filteredTaxa?.length }} taxonomic names where
              {{ nameColumnMap.get(rank) }} starts with '{{ selectedLetter }}'.
            </p>
          </div>
          <div v-else>
            <p>Displaying all {{ filteredTaxa?.length }} taxonomic names.</p>
          </div>
        </div>
        <div class="col-4">
          <div class="text-end"></div>
        </div>
      </div>
      <div class="selection-bar">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
          />
        </label>
        <span v-if="!someSelected" class="item" @click="refresh">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#taxaEditModal"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          @click="validateSelectedTaxaAtPbdb"
          title="Validate taxa at the PBDB"
        >
          <i class="fa-solid fa-check-circle"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#taxaDeleteModal"
          @click="taxaToDelete = filteredTaxa.filter((b) => b.selected)"
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="taxon in filteredTaxa"
            :key="taxon.taxon_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="taxon.selected"
              />
              <div class="list-group-item-name">
                <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
              </div>
              <div class="list-group-item-buttons">
                <RouterLink
                  :to="`/myprojects/${projectId}/taxa/${taxon.taxon_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#taxaDeleteModal"
                  @click="taxaToDelete = [taxon]"
                >
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </LoadingIndicator>
  <DeleteDialog :taxa="taxaToDelete" :projectId="projectId" />
  <EditBatchDialog :batchEdit="batchEdit"></EditBatchDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';

.extinct-icon {
  font-weight: bold;
  margin-right: 4px;
}
</style>
