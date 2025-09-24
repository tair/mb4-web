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
let idx = 0

// normalize the string (convert diacritics to ascii chars)
// then return the first char
function getNormalizedCharAt1(str) {
  try {
    const noTags = str.replace(/<[^>]*>/g, '')
    const nfd = noTags.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const alnumOnly = nfd.replace(/[^a-zA-Z0-9]/g, '')
    return alnumOnly
      .charAt(0)
      .toUpperCase()
  } catch (e) {
    return str
  }
}

let prev_char = ''

onMounted(async () => {
  await projectsStore.fetchProjectTitlesGrouped()
  await projectsStore.fetchMorphoBankStats()
})

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
    </div>

    <div v-if="projectsStore.titlesGrouped != null">
      <div class="d-grid gap-2 d-sm-flex _offset2 mb-4" id="top">
        <div :key="n" v-for="(char, n) in projectsStore.titlesGrouped.chars">
          <a :href="`#${char}`" class="fw-bold">{{ char }}</a>
        </div>
      </div>

      <div :key="n" v-for="(projects, title) in projectsStore.titlesGrouped['titles']">
        <div
          class="fw-bold mt-3"
          v-if="/[A-Z0-9]/.test(getNormalizedCharAt1(title)) && prev_char != getNormalizedCharAt1(title)"
        >
          <a :id="`${getNormalizedCharAt1(title)}`" href="#top">
            <p class="_offset">
              {{ (prev_char = getNormalizedCharAt1(title)) }}
            </p>
          </a>
        </div>

        <div class="mb-2">
          <ul class="list-group list-group-flush">
            <li
              v-for="(project, n) in projects"
              :key="n"
              class="list-group-item py-2"
              style="background-color: #f8f8f8"
            >
              <ProjectDisplayComp 
                :project="project" 
                :showProjectLabel="true" 
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </GenericLoaderComp>
</template>

<style>
._offset {
  padding-top: 100px;
  margin-top: -100px;
}
._offset2 {
  padding-top: 300px;
  margin-top: -300px;
}
</style>
