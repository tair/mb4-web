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
    :errorMessage="
      projectStore.media_views ? null : 'No media views data available.'
    "
    basePath="project"
    itemName="media_views"
  >
    <ul class="list-group">
      <li
        :key="n"
        v-for="(view, n) in projectStore.media_views"
        class="list-group-item"
      >
        {{ view }}
      </li>
    </ul>
  </ProjectLoaderComp>
</template>
