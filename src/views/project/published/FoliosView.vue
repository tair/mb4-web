<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.matrices ? null : 'No folios available.'"
    basePath="project"
  >
    Folios
  </ProjectLoaderComp>
</template>
