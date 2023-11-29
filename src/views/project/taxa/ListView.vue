<script setup>
import axios from 'axios'
import { useRoute } from 'vue-router'
import { computed, onMounted, reactive, ref } from 'vue'
import { useTaxaStore } from '@/stores/TaxaStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import DeleteDialog from '@/views/project/taxa/DeleteDialog.vue'
import {
  TAXA_COLUMN_NAMES,
  TaxaColumns,
  nameColumnMap,
  getTaxonName,
} from '@/utils/taxa'

const route = useRoute()
const projectId = route.params.id

const taxaToDelete = ref([])

const taxaStore = useTaxaStore()

const rank = ref(TaxaColumns.GENUS)
const selectedLetter = ref(null)
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
const filteredTaxa = computed(() =>
  Object.values(filters)
    .reduce((taxa, filter) => taxa.filter(filter), taxaStore.taxa)
    .sort((a, b) => {
      const nameA = getTaxonName(a)
      if (!nameA) {
        return -1
      }

      const nameB = getTaxonName(b)
      if (!nameB) {
        return -1
      }

      return nameA.localeCompare(nameB)
    })
)

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
    taxaStore.fetchTaxaByProjectId(projectId)
  }
})

function refresh() {
  taxaStore.fetchTaxaByProjectId(projectId)
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

function setRank(event) {
  delete filters['page']
  selectedLetter.value = null

  const text = event.target.value
  rank.value = text
}

function clearSearch() {
  for (const key in filters) {
    delete filters[key]
  }

  selectedLetter.value = null
  rank.value = TaxaColumns.GENUS
  selectedGroup.value = {}
  selectedGroupName.value = null
}

function deleteTaxa(taxonIds, remappedTaxonMap) {
  const remappedTaxonIds = Object.fromEntries(remappedTaxonMap.entries())
  const deleted = taxaStore.deleteIds(projectId, taxonIds, remappedTaxonIds)
  if (!deleted) {
    alert('Failed to delete views')
  }
  return deleted
}

async function searchTaxa(text) {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/taxa/search`
  const response = await axios.post(url, {
    text: text,
  })
  const taxonIds = response.data.results
  return taxaStore.taxa.filter((taxon) => taxonIds.includes(taxon.taxon_id))
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="false"
    :errorMessage="null"
    basePath="myprojects"
    itemName="taxa"
  >
    <header>
      There are {{ taxaStore.taxa?.length }} taxa associated with this project.
    </header>
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
    </div>
    <button
      class="btn btn-small btn-secondary"
      type="button"
      @click="clearSearch"
    >
      Clear Search
    </button>
    <div v-if="availableRanks.size > 0">
      Browse By:
      <select @change="setRank">
        <template v-for="[column, name] in nameColumnMap">
          <option
            v-if="availableRanks.has(column)"
            :value="column"
            :selected="rank == column"
          >
            {{ name }}
          </option>
        </template>
      </select>
    </div>
    <div
      v-if="taxaStore.partitions.length > 0 || taxaStore.matrices.length > 0"
    >
      Show by taxa partition or matrix:
      <select @change="setGroup">
        <option value="0">-</option>
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
    <div v-if="taxaStore.taxa?.length">
      <div class="alphabet-bar">
        Display taxa beginning with:
        <template v-for="letter in letters">
          <span
            :class="{ selected: selectedLetter == letter }"
            @click="setPage"
            >{{ letter }}</span
          >
        </template>
        <span class="separator">|</span>
        <span @click="setPage" :class="{ selected: selectedLetter == null }"
          >ALL</span
        >
      </div>
      <div v-if="selectedGroupName && selectedLetter != null">
        Showing {{ filteredTaxa?.length }} taxonomic names from
        <i>{{ selectedGroupName }}</i> where
        {{ nameColumnMap.get(rank) }} starts with '{{ selectedLetter }}'.
      </div>
      <div v-else-if="selectedGroupName">
        Showing {{ filteredTaxa?.length }} taxonomic names from
        <i>{{ selectedGroupName }}</i
        >.
      </div>
      <div v-else-if="selectedLetter != null">
        Showing {{ filteredTaxa?.length }} taxonomic names where
        {{ nameColumnMap.get(rank) }} starts with '{{ selectedLetter }}'.
      </div>
      <div v-else>Showing all {{ filteredTaxa?.length }} taxonomic names.</div>
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
        <span v-if="someSelected" class="item">
          <i class="fa-regular fa-pen-to-square"></i>
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
    <DeleteDialog
      :taxa="taxaToDelete"
      :project-id="projectId"
      :searchTaxa="searchTaxa"
      :deleteTaxa="deleteTaxa"
    />
  </ProjectContainerComp>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
