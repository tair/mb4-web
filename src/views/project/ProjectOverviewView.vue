<script setup>
import { onMounted } from 'vue'
import ProjectDownloads from './overview/ProjectDownloads.vue'
import ProjectMembers from './overview/ProjectMembers.vue'
import ProjectSummary from './overview/ProjectSummary.vue'
import ProjectViews from './overview/ProjectViews.vue'
import ProjectTaxa from './overview/ProjectTaxa.vue'
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
    :key="project_id"
    :project_id="project_id"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.overview ? null : 'No project overview data available.'
    "
    itemName="overview"
  >
    <div class="pb-5 border-bottom"><ProjectSummary></ProjectSummary></div>
    <div class="py-5 border-bottom"><ProjectMembers></ProjectMembers></div>
    <div class="py-5 border-bottom"><ProjectTaxa></ProjectTaxa></div>
    <div class="py-5 border-bottom"><ProjectViews></ProjectViews></div>
    <div class="py-5"><ProjectDownloads></ProjectDownloads></div>
  </ProjectLoaderComp>
</template>
