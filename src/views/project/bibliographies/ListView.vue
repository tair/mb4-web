<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted, reactive, ref } from 'vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import DeleteDialog from '@/views/project/bibliographies/DeleteDialog.vue'
import axios from 'axios'

const route = useRoute()
const projectId = route.params.id

const bibliographiesToDelete = ref([])

const bibliographiesStore = useBibliographiesStore()

const selectedLetter = ref(null)
const letters = computed(() => {
  const letters = new Set()
  for (const bibliography of bibliographiesStore.bibliographies) {
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
const filteredBibliographies = computed(() =>
  Object.values(filters)
    .reduce(
      (bibliographies, filter) => bibliographies.filter(filter),
      bibliographiesStore.bibliographies
    )
    .sort((a, b) => {
      if (a.authors && b.authors) {
        const length = Math.min(a.authors.length, b.authors.length)
        for (let x = 0; x < length; ++x) {
          const surnameA = a.authors[x].surname
          if (!surnameA) {
            return -1
          }

          const surnameB = b.authors[x].surname
          if (!surnameB) {
            return -1
          }

          const compare = surnameA.localeCompare(surnameB)
          if (compare) {
            return compare
          }
        }
      }
    })
)

const allSelected = computed({
  get: function () {
    return filteredBibliographies.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredBibliographies.value.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  filteredBibliographies.value.some((b) => b.selected)
)

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})

function refresh() {
  bibliographiesStore.fetchBibliographies(projectId)
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
  filters['page'] = (bibliography) => {
    if (bibliography.authors && bibliography.authors.length > 0) {
      const author = bibliography.authors[0]
      if (author.surname) {
        const firstLetter = author.surname[0]
        return firstLetter == letter
      }
    }
    return false
  }
}

async function exportEndNote() {
  try {
    const response = await axios.get(
      `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/bibliography/export`,
      {
        responseType: 'blob',
      }
    )

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], {
      type: 'text/tab-separated-values',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `morphobank_bibliography_for_P${projectId}.txt`
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting EndNote file:', error)
    alert('Failed to export EndNote file')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="bibliographiesStore.isLoaded">
    <header>
      There are {{ bibliographiesStore.bibliographies?.length }} bibliographic
      references associated with this project.
    </header>
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/bibliography/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Create Bibliography</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/bibliography/upload`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Import File</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa fa-file-arrow-down"></i>
          <span> Export </span>
        </button>
        <div class="dropdown-menu">
          <button type="button" class="dropdown-item" @click="exportEndNote">
            Endnote tab-delimited File
          </button>
        </div>
      </div>
    </div>
    <div v-if="bibliographiesStore.bibliographies?.length">
      <div class="alphabet-bar">
        Display bibliographic references, ordered by last name of first author:
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
          data-bs-target="#bibliographyDeleteModal"
          @click="
            bibliographiesToDelete = filteredBibliographies.filter(
              (b) => b.selected
            )
          "
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="bibliography in filteredBibliographies"
            :key="bibliography.reference_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="bibliography.selected"
              />
              <div class="list-group-item-name">
                <BibliographyItem :bibliography="bibliography" />
              </div>
              <div class="list-group-item-buttons">
                <RouterLink
                  :to="`/myprojects/${projectId}/bibliography/${bibliography.reference_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#bibliographyDeleteModal"
                  @click="bibliographiesToDelete = [bibliography]"
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
    :bibliographies="bibliographiesToDelete"
    :projectId="projectId"
  ></DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
