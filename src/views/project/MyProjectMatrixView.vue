<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'

import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import ProjectMatrixComp from '@/components/project/ProjectMatrixComp.vue'

const route = useRoute()
const matricesStore = useMatricesStore()

const projectId = route.params.id

onMounted(() => {
  matricesStore.fetchMatricesByProjectId(projectId)
})
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="matricesStore.isLoading"
    :errorMessage="null"
    basePath="myprojects"
    itemName="matrices"
  >
    <header>
      There are {{ matricesStore.matrices?.length }} matrices associated with
      this project.
    </header>
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/matrices/create/choose`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="bi bi-plus-square fa-m"></i>
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
      >
      </ProjectMatrixComp>
    </div>
  </ProjectContainerComp>
</template>
<style scoped>
.matrix-cards {
  margin-bottom: 32px;
  gap: 16px;
}

.action-bar {
  border-bottom: 3px solid rgb(238, 122, 25);
  display: flex;
  gap: 11px;
  margin: 32px 0;
  padding: 8px 0;
}
</style>
