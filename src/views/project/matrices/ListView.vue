<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import ProjectMatrixComp from '@/components/project/ProjectMatrixComp.vue'

const route = useRoute()
const matricesStore = useMatricesStore()

const projectId = route.params.id

onMounted(() => {
  if (!matricesStore.isLoaded) {
    matricesStore.fetchMatricesByProjectId(projectId)
  }
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
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
