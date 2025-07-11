<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import ProjectDownloads from '@/views/project/overview/ProjectDownloads.vue'
import ProjectMembers from '@/views/project/overview/ProjectMembers.vue'
import ProjectSummary from '@/views/project/overview/ProjectSummary.vue'
import ProjectSummarySidePanel from '@/views/project/overview/ProjectSummarySidePanel.vue'
import ProjectViews from '@/views/project/overview/ProjectViews.vue'
import ProjectTaxa from '@/views/project/overview/ProjectTaxa.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id

onMounted(() => {
  projectStore.fetchProject(projectId)
  // Track project overview view
  logView({ project_id: projectId, hit_type: HIT_TYPES.PROJECT })
})
</script>
<template>
  <ProjectLoaderComp
    :key="projectId"
    :projectId="projectId"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.overview ? null : 'No project overview data available.'
    "
    basePath="project"
    itemName="overview"
  >
    <div class="pb-5 border-bottom">
      <div class="row">
        <div class="col border-end">
          <ProjectSummary 
            :overview="projectStore.overview"
            :projectId="projectId"
          ></ProjectSummary>
        </div>
        <div class="col-3">
          <ProjectSummarySidePanel
            :overview="projectStore.overview"
          ></ProjectSummarySidePanel>
        </div>
      </div>
    </div>
  </ProjectLoaderComp>
  <div v-if="projectStore.loaded">
    <div class="py-5 border-bottom">
      <ProjectMembers :members="projectStore.overview.members"></ProjectMembers>
    </div>
    <div class="py-5 border-bottom">
      <ProjectTaxa :taxa="projectStore.overview.taxas"></ProjectTaxa>
    </div>
    <div class="py-5 border-bottom">
      <ProjectViews></ProjectViews>
    </div>
    <div class="py-5">
      <ProjectDownloads></ProjectDownloads>
    </div>
  </div>
</template>
