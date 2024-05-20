<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import DeleteDialog from '@/views/project/institutions/DeleteDialog.vue'

const route = useRoute()
const projectId = route.params.id
const projectInstitutionsStore = useProjectInstitutionStore()
const institutionsToDelete = ref([])

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
})

function refresh() {
  projectInstitutionsStore.fetchInstitutions(projectId)
}

</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <h1>Project Institutions</h1>

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
      <RouterLink :to="`/myProjects/${projectId}/institutions/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span>Add Institutions</span>
        </button>
      </RouterLink>
    </div>

    <div v-if="projectInstitutionsStore.institutions.length">
      
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
