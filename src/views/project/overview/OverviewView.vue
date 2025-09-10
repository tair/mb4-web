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
  <LoadingIndicator :isLoaded="projectOverviewStore.isLoaded">
    <div class="pb-5 border-bottom">
      <div class="row">
        <div class="col border-end">
          <ProjectSummary
            :overview="projectOverviewStore.overview"
            :projectId="projectId"
          ></ProjectSummary>
        </div>
        <div class="col-3">
          <ProjectOverviewSidePanel
            :overview="projectOverviewStore.overview"
            :projectId="projectId"
          ></ProjectOverviewSidePanel>
        </div>
      </div>
    </div>

    <!-- Additional sections for unpublished projects -->
    <div class="mt-4" v-if="projectOverviewStore.overview">
      <!-- Recent Changes -->
      <div class="mb-5" v-if="projectOverviewStore.overview.recent_changes">
        <ProjectRecentChanges
          :recentChanges="projectOverviewStore.overview.recent_changes"
        ></ProjectRecentChanges>
      </div>

      <!-- Members -->
      <div class="mb-5" v-if="projectOverviewStore.overview.members">
        <ProjectMembers
          :members="projectOverviewStore.overview.members"
          :published="projectOverviewStore.overview.published"
        ></ProjectMembers>
      </div>

      <!-- Taxa -->
      <div class="mb-5" v-if="projectOverviewStore.overview.taxa">
        <ProjectTaxa
          :taxa="projectOverviewStore.overview.taxa"
          :published="projectOverviewStore.overview.published"
        ></ProjectTaxa>
      </div>
    </div>
  </LoadingIndicator>
</template>
<style scoped></style>
