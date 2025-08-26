<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import ProjectMatrixComp from '@/components/project/ProjectMatrixComp.vue'
import MatrixCopyrightDialog from '@/components/project/MatrixCopyrightDialog.vue'

const route = useRoute()
const matricesStore = useMatricesStore()
const projectOverviewStore = useProjectOverviewStore()

const projectId = route.params.id

const publish_cc0 = ref(false)

// Computed property to get current publish_cc0 value from project overview
const currentPublishCC0 = computed(() => {
  return projectOverviewStore.overview?.publish_cc0 ? true : false
})

function onCopyrightUpdated(newValue) {
  publish_cc0.value = newValue
  // Refresh project overview to get updated data
  projectOverviewStore.invalidate()
  projectOverviewStore.fetchProject(projectId)
}

onMounted(async () => {
  if (!matricesStore.isLoaded) {
    matricesStore.fetchMatricesByProjectId(projectId)
  }
  
  // Fetch project overview to get current publish_cc0 setting
  if (!projectOverviewStore.isLoaded) {
    await projectOverviewStore.fetchProject(projectId)
  }
  
  // Set initial value
  publish_cc0.value = currentPublishCC0.value
})
</script>
<template>
  <LoadingIndicator :isLoaded="matricesStore.isLoaded">
    <header>
      There are {{ matricesStore.matrices?.length }} matrices associated with
      this project.
    </header>
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/matrices/create/choose`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Create</span>
        </button>
      </RouterLink>
      <button 
        type="button" 
        class="btn btn-m btn-outline-secondary"
        data-bs-toggle="modal" 
        data-bs-target="#matrixCopyrightModal"
      >
        <i class="fa-solid fa-cog"></i>
        <span> Matrix copyright Preferences</span>
      </button>
    </div>
    <div class="d-flex flex-column matrix-cards">
      <ProjectMatrixComp
        v-for="matrix in matricesStore.matrices"
        :key="matrix.matrix_id"
        :matrix="matrix"
        :canEditMatrix="matricesStore.canEditMatrix"
        :partitions="matricesStore.partitions"
        :jobs="matricesStore.jobs"
      >
      </ProjectMatrixComp>
    </div>
  </LoadingIndicator>
  
  <MatrixCopyrightDialog 
    :projectId="projectId"
    :initialValue="currentPublishCC0"
    @updated="onCopyrightUpdated"
  />
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
