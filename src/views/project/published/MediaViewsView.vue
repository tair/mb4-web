<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const mediaViewId = route.params.mediaViewId

const selectedLetter = ref('ALL')

const letters = computed(() => {
  const uniqueLetters = [
    ...new Set(projectStore.media_views.map((view) => view[0].toUpperCase())),
  ]
  return [...uniqueLetters.sort()]
})

const filteredMediaViews = computed(() => {
  if (selectedLetter.value === 'ALL') {
    return projectStore.media_views
  } else {
    return projectStore.media_views.filter((view) =>
      view.toUpperCase().startsWith(selectedLetter.value)
    )
  }
})

onMounted(() => {
  projectStore.fetchProject(projectId)
  // Track media views page view
  logView({ project_id: projectId, hit_type: HIT_TYPES.MEDIA_VIEW })
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
    <div class="mb-3">
      This project has {{ projectStore.media_views.length }} media views.
      Displaying {{ filteredMediaViews?.length }} media views.
    </div>
    <div class="filters mb-3 text-black-50 fw-bold">
      Display media views beginning with:
      <button
        :class="[{ active: selectedLetter == letter }, 'fw-bold']"
        v-for="letter in letters"
        :key="letter"
        @click="selectedLetter = letter"
      >
        {{ letter }}
      </button>
      <span v-if="letters.length > 0">|</span>
      <button class="fw-bold" :key="'ALL'" @click="selectedLetter = 'ALL'">
        ALL
      </button>
    </div>
    <ul class="list-group">
      <li
        :key="n"
        v-for="(view, n) in filteredMediaViews"
        :class="[
          n % 2 != 0 ? 'list-group-item-secondary' : '',
          'list-group-item',
        ]"
      >
        {{ view }}
      </li>
    </ul>
  </ProjectLoaderComp>
</template>
