<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import ProjectMembers from '@/views/project/overview/ProjectMembers.vue'
import ProjectOverviewSidePanel from '@/views/project/overview/ProjectOverviewSidePanel.vue'
import ProjectRecentChanges from '@/views/project/overview/ProjectRecentChanges.vue'
import ProjectSummary from '@/views/project/overview/ProjectSummary.vue'
import ProjectTaxa from '@/views/project/overview/ProjectTaxa.vue'

const route = useRoute()
const projectId = route.params.id

const projectOverviewStore = useProjectOverviewStore()

onMounted(async () => {
  if (!projectOverviewStore.isLoaded) {
    projectOverviewStore.fetchProject(projectId)
  }
})
</script>
<template>
  <div v-if="projectOverviewStore.isLoaded">
    <div
      v-if="projectOverviewStore.overview.recent_changes"
      class="py-5 border-bottom"
    >
      <ProjectRecentChanges
        :recentChanges="projectOverviewStore.overview.recent_changes"
      ></ProjectRecentChanges>
    </div>
    <div
      v-if="projectOverviewStore.overview.members?.length > 0"
      class="py-5 border-bottom"
    >
      <ProjectMembers
        :members="projectOverviewStore.overview.members"
      ></ProjectMembers>
    </div>
    <div class="py-5 border-bottom">
      <ProjectTaxa :taxa="projectOverviewStore.overview.taxa"></ProjectTaxa>
    </div>
  </div>
</template>
