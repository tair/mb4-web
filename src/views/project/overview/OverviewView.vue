<script setup>
import axios from 'axios'
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import ProjectMembers from '@/views/project/overview/ProjectMembers.vue'
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
  <ProjectLoaderComp
    :key="projectId"
    :projectId="projectId"
    :isLoading="!projectOverviewStore.isLoaded"
    :errorMessage="
      projectOverviewStore.overview
        ? null
        : 'No project overview data available.'
    "
    basePath="myprojects"
    itemName="overview"
  >
    <div class="pb-5 border-bottom">
      <div class="row">
        <div class="col border-end">
          <ProjectSummary
            :overview="projectOverviewStore.overview"
          ></ProjectSummary>
        </div>
      </div>
    </div>
  </ProjectLoaderComp>
  <div v-if="projectOverviewStore.isLoaded">
    <div class="py-5 border-bottom">
      <ProjectMembers
        :members="projectOverviewStore.overview.members"
      ></ProjectMembers>
    </div>
    <div class="py-5 border-bottom">
      <ProjectTaxa :taxa="projectOverviewStore.overview.taxa"></ProjectTaxa>
    </div>
  </div>
</template>
<style scoped></style>
