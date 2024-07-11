<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'

const route = useRoute();
const projectStore = usePublicProjectDetailsStore();
const projectId = route.params.id;

const selectedLetter = ref('ALL');

const letters = computed(() => {
  const uniqueLetters = [...new Set(projectStore.media_views.map(view => view[0].toUpperCase()))];
  return [...uniqueLetters.sort()];
});

const filteredMediaViews = computed(() => {
  if (selectedLetter.value === 'ALL') {
    return projectStore.media_views;
  } else {
    return projectStore.media_views.filter(view => view.toUpperCase().startsWith(selectedLetter.value));
  }
});

onMounted(() => {
  projectStore.fetchProject(projectId);
});
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.media_views ? null : 'No media views data available.'"
    basePath="project"
  >
    <div class="mb-3 text-black-50 fw-bold">
      This project has {{ projectStore.media_views.length }} media views.
    </div>
    <div class="filters mb-3 text-black-50 fw-bold">
      Display media views beginning with:
      <button class="fw-bold" v-for="letter in letters" :key="letter" @click="selectedLetter = letter">
        {{ letter }}
      </button>
      <span v-if="letters.length > 1">|</span>
      <button v-if="letters.length > 1" class="fw-bold" :key='ALL' @click="selectedLetter = 'ALL'">ALL</button>
    </div>
    <ul class="list-group">
      <li
        :key="n"
        v-for="(view, n) in filteredMediaViews"
        class="list-group-item"
      >
        {{ view }}
      </li>
    </ul>
  </ProjectLoaderComp>
</template>

<style>
.filters {
  margin-bottom: 10px;
  font-weight: bold;
}

.filters button {
  margin: 0 3px;
  padding: 2px 6px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #ef782f;
}
</style>
