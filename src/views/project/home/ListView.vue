<script setup>
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import ProjectCard from '@/views/project/home/ProjectCard.vue'

const projectsStore = useProjectsStore()

onMounted(() => {
  if (!projectsStore.isLoaded) {
    projectsStore.fetchProjects()
  }
})

const publishedProjects = computed(() => projectsStore.projects.filter(p => p.published))
const unpublishedProjects = computed(() => projectsStore.projects.filter(p => !p.published))
</script>
<template>
  <header>
    <span>You have {{ projectsStore.projects.length }} projects in Morphobank.</span>
    <div v-if="projectsStore.projects.length">
      <b>Jump to:</b>
      <a href="#unpublished">{{ unpublishedProjects.length }} Unpublished Projects</a>
      <a href="#published">{{ publishedProjects.length }} Published Projects</a>
    </div>
    <RouterLink :to="`/myprojects/create`">
      <button type="button" class="btn btn-primary">
        Create
      </button>
    </RouterLink>
  </header>
  <main>
    <a name="unpublished"></a>
    <h2>Unpublished</h2>
    <ProjectCard v-for="project in unpublishedProjects" :project="project"></ProjectCard>

    <a name="published"></a>
    <h2>Published</h2>
    <ProjectCard v-for="project in publishedProjects" :project="project"></ProjectCard>
  </main>
</template>
<style>
</style>