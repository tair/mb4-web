<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore.js'
import GenericLoaderComp from '@/components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '@/components/project/ProjectMenuComp.vue'
import ProjectDisplayComp from '@/components/project/ProjectDisplayComp.vue'
import { getMorphoBankStatsText } from '@/utils/project'

const route = useRoute()
const projectsStore = usePublicProjectsStore()
let sort_by = ref('asc')
let is_asc = ref(true)

onMounted(async () => {
  await projectsStore.fetchProjectTitles(sort_by)
  await projectsStore.fetchMorphoBankStats()
})

function onSorted(sort) {
  if (sort === sort_by.value) return

  sort_by.value = sort
  is_asc.value = sort === 'asc' ? true : false
  projectsStore.fetchProjectTitles(sort)
}

const morphoBankStatsText = computed(() => {
  return getMorphoBankStatsText(projectsStore.morphoBankStats, true)
})
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="!projectsStore.err ? null : 'No project titles available.'"
  >
    <div class="mb-3">
      {{ morphoBankStatsText }}
    </div>

    <div class="d-flex justify-content-between">
      <ProjectMenuComp menuItem="prj_title"></ProjectMenuComp>

      <div class="d-grid gap-1 d-md-flex">
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
        <ProjectDisplayComp 
          :project="title" 
          :showProjectLabel="true" 
        />
      </div>
    </div>
  </GenericLoaderComp>
</template>
