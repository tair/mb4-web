<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimenCitationsStore } from '@/stores/SpecimenCitationsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import AddCitationDialog from '@/views/project/common/AddCitationDialog.vue'
import DeleteDialog from '@/views/project/common/DeleteDialog.vue'
import EditCitationDialog from '@/views/project/common/EditCitationDialog.vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'

const route = useRoute()
const projectId = route.params.id
const specimenId = parseInt(route.params.specimenId)

const specimenCitationsStore = useSpecimenCitationsStore()
const bibliographiesStore = useBibliographiesStore()
const projectUsersStore = useProjectUsersStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const isLoaded = computed(
  () =>
    specimenCitationsStore.isLoaded &&
    bibliographiesStore.isLoaded &&
    projectUsersStore.isLoaded &&
    taxaStore.isLoaded &&
    specimensStore.isLoaded
)

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))
const taxon = computed(() => taxaStore.getTaxonById(specimen.value.taxon_id))

const selectedLetter = ref(null)
const letters = computed(() => {
  const letters = new Set()
  const bibliographyIds = specimenCitationsStore.bibliographyIds
  const bibliographies = bibliographiesStore.getReferencesByIds(bibliographyIds)
  for (const bibliography of bibliographies.values()) {
    if (bibliography.authors && bibliography.authors.length > 0) {
      const author = bibliography.authors[0]
      if (author.surname) {
        const firstLetter = author.surname[0]
        if (firstLetter) {
          letters.add(firstLetter.toUpperCase())
        }
      }
    }
  }
  return [...letters].sort()
})

const filters = reactive({})
const filteredCitations = computed(() =>
  Object.values(filters)
    .reduce(
      (citations, filter) => citations.filter(filter),
      specimenCitationsStore.citations
    )
    .sort((a, b) => {
      const aReference = bibliographiesStore.getReferenceById(a.reference_id)
      const bReference = bibliographiesStore.getReferenceById(b.reference_id)

      if (!aReference?.authors?.length) {
        return -1
      }

      if (!bReference?.authors?.length) {
        return 1
      }

      const length = Math.min(
        aReference.authors.length,
        bReference.authors.length
      )
      for (let x = 0; x < length; ++x) {
        const surnameA = aReference.authors[x].surname
        if (!surnameA) {
          return -1
        }

        const surnameB = bReference.authors[x].surname
        if (!surnameB) {
          return 1
        }

        const compare = surnameA.localeCompare(surnameB)
        if (compare) {
          return compare
        }
      }
    })
)

const allSelected = computed({
  get: function () {
    return filteredCitations.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredCitations.value.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  filteredCitations.value.some((b) => b.selected)
)

onMounted(() => {
  if (!specimenCitationsStore.isLoaded) {
    specimenCitationsStore.fetchCitations(projectId, specimenId)
  }
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

onUnmounted(() => {
  specimenCitationsStore.invalidate()
})

function refresh() {
  specimenCitationsStore.fetchCitations(projectId, specimenId)
}

function setPage(event) {
  const text = event.target.textContent
  if (text == 'ALL') {
    clearFilters()
  } else {
    filterByLetter(text)
  }
}
function clearFilters() {
  selectedLetter.value = null
  delete filters['page']
}

function filterByLetter(letter) {
  selectedLetter.value = letter
  filters['page'] = (citation) => {
    const bibliography = bibliographiesStore.getReferenceById(
      citation.reference_id
    )
    if (bibliography?.authors?.length) {
      const author = bibliography.authors[0]
      if (author.surname) {
        const firstLetter = author.surname[0]
        return firstLetter == letter
      }
    }
    return false
  }
}

const citationToDelete = ref([])
const citationToEdit = ref(null)

async function addCitation(json) {
  const success = await specimenCitationsStore.create(
    projectId,
    specimenId,
    json
  )
  return success
}

async function deleteCitations() {
  const linkIds = citationToDelete.value.map((citation) => citation.link_id)
  const deleted = await specimenCitationsStore.deleteIds(
    projectId,
    specimenId,
    linkIds
  )
  return deleted
}

async function editCitation(linkId, json) {
  const success = await specimenCitationsStore.edit(
    projectId,
    specimenId,
    linkId,
    json
  )
  return success
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ specimenCitationsStore.citations?.length }} citations
      associated with <SpecimenName :specimen="specimen" :taxon="taxon" />
    </header>
    <div class="action-bar">
      <button
        type="button"
        class="btn btn-m btn-outline-primary"
        data-bs-toggle="modal"
        data-bs-target="#addCitationModal"
      >
        <i class="fa fa-plus"></i>
        <span> Add Citation</span>
      </button>
    </div>
    <div v-if="specimenCitationsStore.citations?.length">
      <div class="alphabet-bar">
        Display bibliographic references beginning with:
        <template v-for="letter in letters">
          <span
            :class="{ selected: selectedLetter == letter }"
            @click="setPage"
            >{{ letter }}</span
          >
        </template>
        <span class="separator">|</span>
        <span @click="setPage" :class="{ selected: selectedLetter == null }">
          ALL
        </span>
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
        <span v-if="someSelected" class="item">
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#deleteModal"
          @click="
            citationToDelete = filteredCitations.filter((b) => b.selected)
          "
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="citation in filteredCitations"
            :key="citation.link_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="citation.selected"
              />
              <div class="list-group-item-name">
                <BibliographyItem
                  :bibliography="
                    bibliographiesStore.getReferenceById(citation.reference_id)
                  "
                >
                  <span v-if="citation.pp"> : pages {{ citation.pp }} </span>
                </BibliographyItem>
                <div v-if="citation.notes" class="list-group-item-notes">
                  {{ citation.notes }}
                </div>
              </div>
              <div class="list-group-item-buttons">
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#editCitationModal"
                  @click="citationToEdit = citation"
                >
                  <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteModal"
                  @click="citationToDelete = [citation]"
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
  <AddCitationDialog :addCitation="addCitation"></AddCitationDialog>
  <EditCitationDialog
    :editCitation="editCitation"
    :citation="citationToEdit"
  ></EditCitationDialog>
  <DeleteDialog :delete="deleteCitations">
    <template #modal-body>
      Delete selected {{ citationToDelete.length }} Citation(s)
    </template>
  </DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
