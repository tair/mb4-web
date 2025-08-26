<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore.js'
import GenericLoaderComp from '@/components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '@/components/project/ProjectMenuComp.vue'
import ProjectCardComp from '@/components/project/ProjectCardComp.vue'
import { getMorphoBankStatsText } from '@/utils/project'

const route = useRoute()
const projectsStore = usePublicProjectsStore()
let sort_by = ref('desc')
let is_asc = ref(false)
let page_type = ref(route.path.split('/')[2])

onMounted(async () => {
  page_type.value = route.path.split('/')[2]
  // set default sort desc - this will fetch projects if needed
  onSorted(sort_by)
  // fetch MorphoBank statistics
  await projectsStore.fetchMorphoBankStats()
})

let selectedPage = ref(projectsStore.currentPage)
let selectedPageSize = ref(projectsStore.itemsPerPage)

function onSorted(sort) {
  sort_by.value = sort
  is_asc.value = sort === 'asc' ? true : false

  switch (page_type.value) {
    case 'pub_date':
      projectsStore.sortProjectsByPublishedDate(sort)
      break
    case 'prj_no':
      projectsStore.sortProjectsByNumber(sort)
      break
    case 'journal_year':
      projectsStore.sortProjectsByJournalYear(sort)
      break
  }

  selectedPage.value = 1
  selectedPageSize.value = 25
}

watch(route, (currValue, oldValue) => {
  let currPath = currValue.path.split('/')[2]
  if (page_type.value == currPath) return

  page_type.value = currPath
  // prj_no, pub_date, journal_year
  sort_by.value = 'desc'
  is_asc.value = false

  onSorted(sort_by.value)
})

watch(selectedPage, (currentValue, oldValue) => {
  projectsStore.currentPage = currentValue
  projectsStore.fetchByPage()
})

watch(selectedPageSize, (currentValue) => {
  projectsStore.itemsPerPage = currentValue
  projectsStore.currentPage = 1
  projectsStore.recalculatePageInfo()
  projectsStore.fetchByPage()
})

const morphoBankStatsText = computed(() => {
  return getMorphoBankStatsText(projectsStore.morphoBankStats, false)
})
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="!projectsStore.err ? null : 'No projects list available.'"
  >
    <div class="mb-3">
      {{ morphoBankStatsText }}
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

    <div class="row row-cols-auto g-4 py-5">
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
