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
    :errorMessage="
      projectStore.media_views ? null : 'No media views data available.'
    "
    basePath="project"
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
