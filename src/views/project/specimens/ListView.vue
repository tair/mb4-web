<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
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

const specimensToDelete = ref([])

const taxaMap = computed(() => {
  const taxaMap = new Map()
  for (const specimen of specimensStore.specimens) {
    const taxon = taxaStore.getTaxonById(specimen.taxon_id)
    if (taxon) {
      taxaMap.set(specimen.taxon_id, taxon)
    }
  }
  return taxaMap
})

const filters = reactive({})
const filteredSpecimens = computed(() =>
  Object.values(filters)
    .reduce(
      (specimens, filter) => specimens.filter(filter),
      specimensStore.specimens
    )
    .sort((a, b) => {
      const nameA = getTaxonName(taxaMap.value.get(a.taxon_id))
      if (!nameA) {
        return -1
      }

      const nameB = getTaxonName(taxaMap.value.get(b.taxon_id))
      if (!nameB) {
        return -1
      }

      return nameA.localeCompare(nameB)
    })
)

const rank = ref(TaxaColumns.GENUS)
const availableRanks = computed(() => {
  const ranks = new Set()
  for (const taxon of taxaMap.value.values()) {
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
  for (const taxon of taxaMap.value.values()) {
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
    taxaStore.fetchTaxaByProjectId(projectId)
  }
})

function refresh() {
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetchTaxaByProjectId(projectId)
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
    const taxon = taxaMap.value.get(specimen.taxon_id)
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

async function deleteSpecimens(specimenIds) {
  const deleted = specimensStore.deleteIds(projectId, specimenIds)
  if (!deleted) {
    alert('Failed to delete specimens')
  }
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!specimensStore.isLoaded || !taxaStore.isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="specimens"
  >
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
          data-bs-target="#specimenDeleteModal"
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
                  :referenceSource="specimen.reference_source"
                  :institutionCode="specimen.institution_code"
                  :collectionCode="specimen.collection_code"
                  :catalogNumber="specimen.catalog_number"
                  :taxon="taxaMap.get(specimen.taxon_id)"
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
                  data-bs-target="#specimenDeleteModal"
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
    <div class="modal" id="specimenDeleteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm</h5>
          </div>
          <div class="modal-body" v-if="specimensToDelete.length">
            Really delete specimen:
            <p
              v-for="specimen in specimensToDelete"
              :key="specimen.specimen_id"
            >
              <SpecimenName
                :referenceSource="specimen.reference_source"
                :institutionCode="specimen.institution_code"
                :collectionCode="specimen.collection_code"
                :catalogNumber="specimen.catalog_number"
                :taxon="taxaMap.get(specimen.taxon_id)"
              />
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              data-bs-dismiss="modal"
              @click="
                deleteSpecimens(specimensToDelete.map((s) => s.specimen_id))
              "
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </ProjectContainerComp>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
