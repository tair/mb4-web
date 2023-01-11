<script setup>
import { onMounted } from 'vue'
import { useProjectStore } from '@/stores/storeProjectDetails.js'
import ProjectLoaderComp from '../../components/project/ProjectLoaderComp.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const projectStore = useProjectStore()
const projectId = route.params.id

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :projectId="projectId"
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.matrices ? null : 'No matrix data available.'"
    basePath="project"
    itemName="matrices"
  >
    {{ projectStore.matrices }}
  </ProjectLoaderComp>
</template>
