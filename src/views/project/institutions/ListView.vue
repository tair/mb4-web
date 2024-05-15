<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import DeleteDialog from '@/views/project/institutions/DeleteDialog.vue'

const route = useRoute()
const projectId = route.params.id
const ProjectInstitutionsStore = useProjectInstitutionStore()
const institutionsToDelete = ref([])

const isLoaded = computed(() => ProjectInstitutionsStore.isLoaded)

const selectedLetter = ref(null)
const letters = computed(() => {
  const letters = new Set()
  for (const institution of ProjectInstitutionsStore.institutions) {
    if (institution?.name?.length > 0) {
      const firstLetter = institution.name[0]
      letters.add(firstLetter.toUpperCase())
    }
  }
  return [...letters].sort()
})

const filters = reactive({})
const filteredInstitutions = computed(() =>
  Object.values(filters)
    .reduce(
      (institutions, filter) => institutions.filter(filter),
      ProjectInstitutionsStore.institutions
    )
    .sort((a, b) => {
      const nameA = a.name
      if (!nameA) {
        return -1
      }

      const nameB = b.name
      if (!nameB) {
        return -1
      }

      const compare = nameA.localeCompare(nameB)
      if (compare) {
        return compare
      }
    })
)

const allSelected = computed({
  get: function () {
    return filteredInstitutions.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredInstitutions.value.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  filteredInstitutions.value.some((b) => b.selected)
)

onMounted(() => {
  if (!ProjectInstitutionsStore.isLoaded) {
    ProjectInstitutionsStore.fetchInstitutions(projectId)
  }
})

function refresh() {
  ProjectInstitutionsStore.fetchInstitutions(projectId)
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
  filters['page'] = (institution) => {
    if (institution?.name.length > 0) {
      const name = institution?.name[0]
      return name.toUpperCase() == letter
    }
    return false
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <h1>Project Institutions</h1>

    <header>
      There are
      {{
        ProjectInstitutionsStore.institutions.length != 0
          ? ProjectInstitutionsStore.institutions.length
          : 'no'
      }}
      institutions associated with this project.
    </header>

    <div class="action-bar">
      <RouterLink :to="`/myProjects/${projectId}/institutions/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span>Add Institutions</span>
        </button>
      </RouterLink>
    </div>

    <div v-if="filteredInstitutions.length">
      <div class="alphabet-bar">
        Display institutions beginning with:
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
          data-bs-target="#viewDeleteModal"
          @click="
            institutionsToDelete = filteredInstitutions.filter(
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
            v-for="institution in filteredInstitutions"
            :key="institution.institutionId"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="institution.selected"
              />
              <div class="list-group-item-name">
                {{ institution.name }}
              </div>
              <div class="list-group-item-buttons">
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#viewDeleteModal"
                  @click="institutionsToDelete = [institution]"
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
    :institutions="institutionsToDelete"
    :projectId="projectId"
  ></DeleteDialog>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>
