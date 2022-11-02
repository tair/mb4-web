<script setup>
import { ref, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/storeProjects.js'
import GenericLoaderComp from '../../components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '../../components/project/ProjectMenuComp.vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const projectsStore = useProjectsStore()
let sort_by = ref('asc')
let is_asc = ref(true)

onMounted(() => {
  projectsStore.fetchProjectTitles(sort_by)
})

function onSorted(sort) {
  if (sort === sort_by.value) return

  sort_by.value = sort
  is_asc.value = sort === 'asc' ? true : false
  projectsStore.fetchProjectTitles(sort)
}
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="!projectsStore.err ? null : 'No project titles available.'"
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
      <ProjectMenuComp menuItem="prj_title"></ProjectMenuComp>

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

    <div class="list-group" :key="n" v-for="(title, n) in projectsStore.titles">
      <div class="list-group-item list-group-item-action mb-2">
        <div class="row">
          <div class="col-2">Project {{ title.project_id }}:</div>

          <div class="col">
            <RouterLink
              :to="`/project/${title.project_id}/overview`"
              class="nav-link p-0"
            >
              <div v-html="title.name"></div>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </GenericLoaderComp>
</template>
