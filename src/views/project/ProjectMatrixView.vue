<script setup>
import { onMounted } from 'vue'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '../../components/project/ProjectLoaderComp.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
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
