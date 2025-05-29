<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const bibliographyId = route.params.bibliographyId

const selectedLetter = ref('ALL')

const letters = computed(() => {
  const uniqueLetters = [
    ...new Set(
      projectStore.bibliography.map((bibliography) =>
        bibliography.title[0].toUpperCase()
      )
    ),
  ]
  return [...uniqueLetters.sort()]
})

const filteredBibliographies = computed(() => {
  if (selectedLetter.value === 'ALL') {
    return projectStore.bibliography
  } else {
    return projectStore.bibliography.filter((bibliography) =>
      bibliography.title.toUpperCase().startsWith(selectedLetter.value)
    )
  }
})

onMounted(() => {
  projectStore.fetchProject(projectId)
  // Track bibliography page view
  logView({ project_id: projectId, hit_type: HIT_TYPES.BIBLIOGRAPHY })
})
</script>

<template>
  <ProjectLoaderComp
    :projectId="projectId"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.bibliography ? null : 'No bibliography data available.'
    "
    basePath="project"
    itemName="bibliography"
  >
    <div class="mb-3">
      This project has {{ projectStore.bibliography?.length }} bibliographic
      references. Displaying {{ filteredBibliographies.length }} bibliographic
      references.
    </div>

    <div class="filters mb-3 text-black-50 fw-bold">
      Display bibliographic references, ordered by last name of first author:
      <button
        :class="[{ active: selectedLetter == letter }, 'fw-bold']"
        v-for="letter in letters"
        :key="letter"
        @click="selectedLetter = letter"
      >
        {{ letter }}
      </button>
      <span v-if="letters.length > 0">|</span>
      <button class="fw-bold" :key="ALL" @click="selectedLetter = 'ALL'">
        ALL
      </button>
    </div>

    <ul class="list-group">
      <li
        :key="n"
        v-for="(b, n) in filteredBibliographies"
        :class="[
          n % 2 != 0 ? 'list-group-item-secondary' : '',
          'list-group-item',
        ]"
        v-html="b.title"
      ></li>
    </ul>
  </ProjectLoaderComp>
</template>
