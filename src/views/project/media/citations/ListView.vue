<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useMediaCitationsStore } from '@/stores/MediaCitationsStore'
import DeleteDialog from '@/views/project/media/citations/DeleteDialog.vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const mediaId = route.params.mediaId

const mediaCitationsStore = useMediaCitationsStore()
const bibliographiesStore = useBibliographiesStore()
const isLoaded = computed(
  () => mediaCitationsStore.isLoaded && bibliographiesStore.isLoaded
)

const citationToDelete = ref([])

const selectedLetter = ref(null)
const letters = computed(() => {
  const letters = new Set()
  const bibliographyIds = mediaCitationsStore.bibliographyIds
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
      mediaCitationsStore.citations
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
  if (!mediaCitationsStore.isLoaded) {
    mediaCitationsStore.fetchCitations(projectId, mediaId)
  }
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})

function refresh() {
  mediaCitationsStore.fetchCitations(projectId, mediaId)
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
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ mediaCitationsStore.citations?.length }} citations associated
      with M{{ mediaId }}
    </header>
    <div class="action-bar">
      <RouterLink
        :to="`/myprojects/${projectId}/media/${mediaId}/citations/create`"
      >
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Citation</span>
        </button>
      </RouterLink>
    </div>
    <div v-if="mediaCitationsStore.citations?.length">
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
        <span v-if="someSelected" class="item">
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaCitationDeleteModal"
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
                <RouterLink
                  :to="`/myprojects/${projectId}/media/${mediaId}/citations/${citation.link_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#mediaCitationDeleteModal"
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
  <DeleteDialog
    :citations="citationToDelete"
    :projectId="projectId"
  ></DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
