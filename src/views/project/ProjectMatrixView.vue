<script setup>
import { onMounted } from 'vue'
import { useProjectStore } from '@/stores/storeProjectDetails.js'
import ProjectLoaderComp from '../../components/project/ProjectLoaderComp.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const projectStore = useProjectStore()
const project_id = route.params.id
onMounted(() => {
  projectStore.fetchProject(project_id)
})
</script>

<template>
  <ProjectLoaderComp
    :project_id="project_id"
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.matrices ? null : 'No matrix data available.'"
    itemName="matrices"
  >
    {{ projectStore.matrices }}
  </ProjectLoaderComp>
</template>
