<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
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
  sortTaxaAlphabetically,
} from '@/utils/taxa'
import { getSpecimenName } from '@/utils/specimens'

const route = useRoute()
const projectId = route.params.id

const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const isLoaded = computed(() => specimensStore.isLoaded && taxaStore.isLoaded)

const specimensToDelete = ref([])
const showUnidentified = ref(false)

const filters = reactive({})
const filteredSpecimens = computed(() => {
  let specimens = showUnidentified.value
    ? specimensStore.unidentifiedSpecimens
    : specimensStore.identifiedSpecimens
  return Object.values(filters)
    .reduce((specimens, filter) => specimens.filter(filter), specimens)
    .sort((a, b) => {
      if (showUnidentified.value) {
        // Sort unidentified specimens by institution code, collection code, and catalog number
        const aKey = `${a.institution_code || ''}${a.collection_code || ''}${
          a.catalog_number || ''
        }`
        const bKey = `${b.institution_code || ''}${b.collection_code || ''}${
          b.catalog_number || ''
        }`
        return aKey.localeCompare(bKey)
      }

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
})

const rank = ref(TaxaColumns.GENUS)
const availableRanks = computed(() => {
  const ranks = new Set()
  const taxaIds = new Set(specimensStore.taxaIds)
  const taxa = taxaStore.getTaxaByIds(taxaIds)
  for (const taxon of taxa) {
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
  const taxaIds = new Set(specimensStore.taxaIds)
  const taxa = taxaStore.getTaxaByIds(taxaIds)
  for (const taxon of taxa) {
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

// If user is viewing unidentified specimens and they become empty (e.g., after delete),
// automatically switch back to identified view.
watch(
  () => specimensStore.unidentifiedSpecimens?.length,
  (len) => {
    if (showUnidentified.value && (!len || len === 0)) {
      showUnidentified.value = false
    }
  }
)

function refresh() {
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
}

function setPage(event) {
  if (showUnidentified.value) {
    return
  }

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
  if (showUnidentified.value) {
    return
  }

  delete filters['page']
  selectedLetter.value = null

  const text = event.target.value
  rank.value = text
}

function getMediaLinkForSpecimen(specimen) {
  const taxon = taxaStore.getTaxonById(specimen.taxon_id)
  // Get clean taxon name without extinct marker or specimen reference
  const cleanTaxonName = getTaxonName(taxon, TaxaColumns.GENUS, false).trim()
  return {
    name: 'MyProjectMediaView',
    params: { id: projectId },
    query: { search: cleanTaxonName }
  }
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
    <div
      v-if="
        specimensStore.identifiedSpecimens?.length ||
        specimensStore.unidentifiedSpecimens?.length
      "
    >
      <div class="row mb-3">
        <div class="col-8">
          <p v-if="!showUnidentified">
            Displaying {{ filteredSpecimens?.length }} identified specimens.
          </p>
          <p v-else>
            Displaying {{ filteredSpecimens?.length }} unidentified specimens.
          </p>
        </div>
        <div class="col-4">
          <div
            class="text-end"
            v-if="specimensStore.unidentifiedSpecimens?.length"
          >
            <select id="showUnidentified" v-model="showUnidentified">
              <option :value="true">Show Unidentified Specimens</option>
              <option :value="false">Show Identified Specimens</option>
            </select>
          </div>
        </div>
      </div>
      <div v-if="availableRanks.size > 0 && !showUnidentified">
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
      <div class="alphabet-bar" v-if="!showUnidentified">
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
        <label class="item" title="Select all">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
            aria-label="Select all items"
            title="Select all"
          />
          <span class="ms-2">Select All</span>
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
                <span v-if="specimen.media_count > 0" class="ms-2 text-muted small">
                  (<RouterLink
                    :to="getMediaLinkForSpecimen(specimen)"
                    class="text-decoration-none"
                  >
                    {{ specimen.media_count }} media
                  </RouterLink>)
                </span>
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
