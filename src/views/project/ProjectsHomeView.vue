<script setup>
import { ref, watch, onMounted } from "vue";
import { useProjectsStore } from "@/stores/storeProjects.js";
import GenericLoaderComp from "../../components/project/GenericLoaderComp.vue";
import ProjectMenuComp from "../../components/project/ProjectMenuComp.vue";
import ProjectCardComp from "../../components/project/ProjectCardComp.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const projectsStore = useProjectsStore();

onMounted(() => {
  projectsStore.fetchProjects();
});

let selectedPage = ref(projectsStore.currentPage);
let selectedPageSize = ref(projectsStore.itemsPerPage);

watch(selectedPage, (currentValue, oldValue) => {
  projectsStore.currentPage = currentValue;
  projectsStore.fetchByPage();
});

watch(selectedPageSize, (currentValue, oldValue) => {
  projectsStore.itemsPerPage = currentValue;
  projectsStore.currentPage = 1;
  projectsStore.recalculatePageInfo();
  projectsStore.fetchByPage();
});
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="!projectsStore.err ? null : 'No projects list available.'"
  >
    <div class="mb-3">
      There are {{ projectsStore.projects?.length }} publicly accessible
      projects as of April 23, 2022 in MorphoBank. Publicly available projects
      contain 159,761 images and 660 matrices. MorphoBank also has an additional
      1,501 projects that are in progress. These contain an additional 153,815
      images and 1,310 matrices. These will become available as scientists
      complete their research and release these data. 3,400 scientists and
      students are content builders on MorphoBank. 1801 site visitors viewed or
      downloaded data in the last thirty days.
    </div>

    <div class="d-flex justify-content-between">
      <ProjectMenuComp menuItem="pub-date"></ProjectMenuComp>
    <div class="d-grid gap-2 d-md-flex">
      <button type="button" class="btn btn-warning btn-sm">
        Publication Date
      </button>
      <button type="button" class="btn btn-secondary btn-sm">
        Project Number
      </button>
      <button type="button" class="btn btn-secondary btn-sm">
        Project title
      </button>
      <button type="button" class="btn btn-secondary btn-sm">Author</button>
      <button type="button" class="btn btn-secondary btn-sm">
        Publication
      </button>
      <button type="button" class="btn btn-secondary btn-sm">Popular</button>
    </div>

    <div class="d-flex justify-content-end">
      <div class="me-5">
        Showing page
        <select v-model="selectedPage">
          <option
            :selected="idx == 1"
            v-for="(idx, type) in projectsStore.totalPages"
            :value="idx"
          >
            {{ idx }}
          </option>
        </select>
        of {{ projectsStore.totalPages }} pages.
      </div>

      <div class="d-grid gap-1 d-md-flex">
        <div class="me-3">
          Items per page:
          <select v-model="selectedPageSize">
            <option
              :selected="idx == 10"
              v-for="(idx, type) in [3, 5, 10, 25, 50, 100]"
              :value="idx"
            >
              {{ idx }}
            </option>
          </select>
        </div>
        <div>
          Showing page
          <select v-model="selectedPage">
            <option
              :selected="idx == 1"
              v-for="(idx, type) in projectsStore.totalPages"
              :value="idx"
            >
              {{ idx }}
            </option>
          </select>
          of {{ projectsStore.totalPages }} pages
        </div>
      </div>
    </div>

    <div class="row align-items-stretch g-4 py-5">
      <div
        class="col d-flex align-items-stretch"
        v-for="(project, index) in projectsStore.projectList"
        :key="index"
      >
        <ProjectCardComp :key="project.project_id" :project="project">
        </ProjectCardComp>
      </div>
    </div>
  </GenericLoaderComp>
</template>
