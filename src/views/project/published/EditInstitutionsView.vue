<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import DeleteDialog from '@/views/project/institutions/DeleteDialog.vue'
// import EditDialog from '@/views/project/institutions/EditDialog.vue'

const route = useRoute()
const projectId = route.params.id
const projectInstitutionsStore = useProjectInstitutionStore()
const institutionsToDelete = ref([])
// const institutionToEdit = ref([])
const showCacheWarning = ref(true)

const isLoaded = computed(() => projectInstitutionsStore.isLoaded)

const allSelected = computed({
  get: function () {
    return projectInstitutionsStore.institutions.every((b) => b.selected)
  },
  set: function (value) {
    projectInstitutionsStore.institutions.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  projectInstitutionsStore.institutions.some((b) => b.selected)
)

onMounted(() => {
  if (!projectInstitutionsStore.isLoaded) {
    projectInstitutionsStore.fetchInstitutions(projectId)
  }

  projectInstitutionsStore.institutions.sort((first, second) => {
    const first_string = first.name.toUpperCase()
    const second_string = second.name.toUpperCase()

    if (first_string < second_string) {
      return -1
    }
    if (first_string > second_string) {
      return 1
    }
    return 0
  })
})

function refresh() {
  projectInstitutionsStore.fetchInstitutions(projectId)
}
</script>

<template>
  <ProjectLoaderComp
    :projectId="projectId"
    :isLoading="!isLoaded"
    :errorMessage="null"
    basePath="project"
  >
    <h1>Project Institutions</h1>

    <div v-if="showCacheWarning" class="cache-warning-banner">
      <i class="fa fa-info-circle me-2"></i>
      <span>Project updates may take a few minutes to reflect. Please refresh the page manually to see updates as old values may be cached by your browser.</span>
      <button 
        type="button" 
        class="cache-warning-close" 
        @click="showCacheWarning = false"
        aria-label="Dismiss warning"
      >
        <i class="fa fa-times"></i>
      </button>
    </div>

    <header>
      There are
      {{
        projectInstitutionsStore.institutions.length != 0
          ? projectInstitutionsStore.institutions.length
          : 'no'
      }}
      institutions associated with this project.
    </header>

    <div class="action-bar">
      <RouterLink :to="`/project/${projectId}/institutions/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span>Add Institutions</span>
        </button>
      </RouterLink>
    </div>

    <div v-if="projectInstitutionsStore.institutions.length">
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
          data-bs-target="#viewDeleteModal"
          @click="
            institutionsToDelete = projectInstitutionsStore.institutions.filter(
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
            v-for="institution in projectInstitutionsStore.institutions"
            :key="institution.institution_id"
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
                <!-- <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#viewEditModal"
                  @click="institutionToEdit = institution"
                >
                  <i class="fa-regular fa-pen-to-square"></i>
                </button> -->
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
  </ProjectLoaderComp>
  <!-- <EditDialog
    :projectId="projectId"
    :institution="institutionToEdit"
  ></EditDialog> -->
  <DeleteDialog
    :institutions="institutionsToDelete"
    :projectId="projectId"
  ></DeleteDialog>
</template>

<style scoped>
@import '@/views/project/styles.css';

.cache-warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #004085;
  position: relative;
}

.cache-warning-banner i.fa-info-circle {
  color: #0066cc;
  flex-shrink: 0;
}

.cache-warning-banner span {
  flex: 1;
  line-height: 1.4;
}

.cache-warning-close {
  background: none;
  border: none;
  color: #004085;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.cache-warning-close:hover {
  opacity: 1;
}
</style>

