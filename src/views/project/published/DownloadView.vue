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
    :key="projectId"
    :projectId="projectId"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.overview ? null : 'No project overview data available.'
    "
    basePath="project"
    itemName="overview"
  >
    <p>
      This tool downloads the entire project, all media, matrices and documents,
      as a zipped file. Please click on the menu to the left, if you only want a
      Matrix, certain Media or Documents.
    </p>
    <p>
      Media that have been released for 'one time use on MorphoBank only' will
      not be part of the download packet.
    </p>
    <p class="minor-text">
      The zipped archive has most project data formatted in an XML-format file
      conforming to the Structure of Descriptive Data (SDD) standard (<a
        href="http://wiki.tdwg.org/twiki/bin/view/SDD/WebHome"
        target="_blank"
        >http://wiki.tdwg.org/twiki/bin/view/SDD/WebHome</a
      >). See the MorphoBank manual for more information.
    </p>
  </ProjectLoaderComp>
</template>
<style>
.minor-text {
  color: #828282;
  font-size: 0.8rem;
}
</style>
