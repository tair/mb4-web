<script setup>
import { computed } from 'vue'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore.js'

const projectOverviewStore = useProjectOverviewStore()

// Computed property to format the project title
const projectTitle = computed(() => {
  if (!projectOverviewStore.overview) return null
  
  const overview = projectOverviewStore.overview
  // Use article_title if available, fallback to name
  return overview.article_title || overview.name || `Project ${overview.project_id}`
})

const hasProjectData = computed(() => {
  return projectOverviewStore.overview && projectOverviewStore.isLoaded
})
</script>

<template>
  <div v-if="hasProjectData" class="project-title-bar mb-3 pb-2 border-bottom">
    <div class="fw-medium text-dark">
      {{ projectTitle }}
    </div>
  </div>
</template>

<style scoped>
.project-title-bar {
  font-size: 1.1rem;
  line-height: 1.5;
  font-weight: bold;
}
</style>

