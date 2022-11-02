<script setup>
import { ref, watch, onMounted } from "vue";
import { useProjectsStore } from "@/stores/storeProjects.js";
import GenericLoaderComp from "../../components/project/GenericLoaderComp.vue";
import ProjectMenuComp from "../../components/project/ProjectMenuComp.vue";
import ProjectCardComp from "../../components/project/ProjectCardComp.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const projectsStore = useProjectsStore();
let sort_by = ref("desc");
let is_asc = ref(false);
let page_type = ref(route.path.split("/")[2]);

onMounted(() => {
  page_type.value = route.path.split("/")[2];
  projectsStore.fetchProjects();
  projectsStore.sortProjectsByPublishedDate("desc");
});

let selectedPage = ref(projectsStore.currentPage);
let selectedPageSize = ref(projectsStore.itemsPerPage);

function log(msg) {
  console.log(msg);
}

function onSorted(sort) {
  // if (sort === sort_by.value) return;

  sort_by.value = sort;
  is_asc.value = sort === "asc" ? true : false;

  if (page_type.value == "pub_date")
    projectsStore.sortProjectsByPublishedDate(sort);
  else if (page_type.value == "prj_no")
    projectsStore.sortProjectsByNumber(sort);

  selectedPage.value = 1;
  selectedPageSize.value = 25;
}

watch(route, (currValue, oldValue) => {
  let currPath = currValue.path.split("/")[2];
  if (page_type.value == currPath) return;

  page_type.value = currPath;

  if (currPath == "prj_no") {
    sort_by.value = "asc";
    is_asc.value = true;
  } else if (currPath == "pub_date") {
    sort_by.value = "desc";
    is_asc.value = false;
  }

  onSorted(sort_by.value);
});

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
      <ProjectMenuComp :menuItem="page_type"></ProjectMenuComp>

      <div class="d-grid gap-1 d-sm-flex">
        <a
          href="#"
          @click="onSorted('asc')"
          :style="{ color: is_asc ? '#ef782f' : 'gray' }"
          ><i class="fa-solid fa-arrow-up fa-xl"></i
        ></a>

        <a
          href="#"
          @click="onSorted('desc')"
          :style="{ color: !is_asc ? '#ef782f' : 'gray' }"
          ><i class="fa-solid fa-arrow-down fa-xl"></i
        ></a>
      </div>
    </div>

    <div class="d-flex justify-content-end border-bottom border-top py-2">
      <div class="d-grid gap-1 d-sm-flex">
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
