<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import DeleteDialog from '@/views/project/specimens/DeleteDialog.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'
import {
  TAXA_COLUMN_NAMES,
  TaxaColumns,
  getTaxonName,
  nameColumnMap,
} from '@/utils/taxa'

const route = useRoute()
const projectId = route.params.id

const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const isLoaded = computed(() => specimensStore.isLoaded && taxaStore.isLoaded)

const specimensToDelete = ref([])

const filters = reactive({})
const filteredSpecimens = computed(() =>
  Object.values(filters)
    .reduce(
      (specimens, filter) => specimens.filter(filter),
      specimensStore.specimens
    )
    .sort((a, b) => {
      const nameA = getTaxonName(
        taxaStore.getTaxonById(a.taxon_id),
        TaxaColumns.GENUS,
        false
      )
      if (!nameA) {
        return -1
      }

      const nameB = getTaxonName(
        taxaStore.getTaxonById(b.taxon_id),
        TaxaColumns.GENUS,
        false
      )
      if (!nameB) {
        return -1
      }

      return nameA.localeCompare(nameB)
    })
)

const rank = ref(TaxaColumns.GENUS)
const availableRanks = computed(() => {
  const ranks = new Set()
  const taxaIds = specimensStore.taxaIds
  const taxa = taxaStore.getTaxaByIds(taxaIds)
  for (const taxon of taxa.values()) {
    for (const columnName of TAXA_COLUMN_NAMES)
      if (columnName in taxon && taxon[columnName]?.length > 0) {
        ranks.add(columnName)
      }
  }
  return ranks
})

const selectedLetter = ref(null)
const letters = computed(() => {
  const letters = new Set()
  const taxaIds = specimensStore.taxaIds
  const taxa = taxaStore.getTaxaByIds(taxaIds)
  for (const taxon of taxa.values()) {
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

const allSelected = computed({
  get: function () {
    return filteredSpecimens.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredSpecimens.value.forEach((b) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() =>
  filteredSpecimens.value.some((b) => b.selected)
)

onMounted(() => {
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
})

function refresh() {
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
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
  filters['page'] = (specimen) => {
    const taxon = taxaStore.getTaxonById(specimen.taxon_id)
    if (taxon && taxon[index] && taxon[index].length > 0) {
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
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ specimensStore.specimens?.length }} specimens associated with
      this project.
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/specimens/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Specimen</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/specimens/upload`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-file-arrow-up"></i>
          <span> Import File</span>
        </button>
      </RouterLink>
    </div>
    <div v-if="specimensStore.specimens?.length">
      <div v-if="availableRanks.size > 0">
        Show specimens whose
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
      <div class="alphabet-bar">
        begins with:
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
          data-bs-target="#specimensDeleteModal"
          @click="
            specimensToDelete = filteredSpecimens.filter((b) => b.selected)
          "
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="specimen in filteredSpecimens"
            :key="specimen.specimen_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="specimen.selected"
              />
              <div class="list-group-item-name">
                <SpecimenName
                  :specimen="specimen"
                  :taxon="taxaStore.getTaxonById(specimen.taxon_id)"
                />
              </div>
              <div class="list-group-item-buttons">
                <RouterLink
                  :to="`/myprojects/${projectId}/specimens/${specimen.specimen_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#specimensDeleteModal"
                  @click="specimensToDelete = [specimen]"
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
  <DeleteDialog :specimens="specimensToDelete" :projectId="projectId" />
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
