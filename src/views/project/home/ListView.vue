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

const publishedProjects = computed(() =>
  projectsStore.projects.filter((p) => p.published)
)
const unpublishedProjects = computed(() =>
  projectsStore.projects.filter((p) => !p.published)
)
</script>
<template>
  <header>
    <div class="row">
      <div class="col-md-3"><h2>My Projects</h2></div>
      <div class="col-md-9">
        <div class="mb-2">
          You have {{ projectsStore.projects.length }} projects in Morphobank.
        </div>
        <div v-if="projectsStore.projects.length">
          <b class="me-2">Jump to:</b>
          <a href="#unpublished" v-if="unpublishedProjects.length"
            >{{ unpublishedProjects.length }} Unpublished Projects</a
          >
          <span
            v-if="unpublishedProjects.length && publishedProjects.length"
            class="ms-2 me-2"
            >|</span
          >
          <a href="#published" v-if="publishedProjects.length"
            >{{ publishedProjects.length }} Published Projects</a
          >
        </div>
        <div class="mt-3">
          <RouterLink :to="`/myprojects/create`">
            <button type="button" class="btn btn-primary">
              Create New Project
            </button>
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
  <main>
    <div v-if="unpublishedProjects.length">
      <hr />
      <a name="unpublished"></a>
      <h3 class="mb-3">Unpublished Projects</h3>

      <ProjectCard v-for="project in unpublishedProjects" :project="project">
      </ProjectCard>
    </div>
    <div v-if="publishedProjects.length">
      <hr />
      <a name="published"></a>
      <h3 class="mb-3">Published Projects</h3>
      <ProjectCard v-for="project in publishedProjects" :project="project">
      </ProjectCard>
    </div>
  </main>
</template>
<style></style>
