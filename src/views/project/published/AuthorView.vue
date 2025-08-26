<script setup>
import { onMounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore.js'
import GenericLoaderComp from '@/components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '@/components/project/ProjectMenuComp.vue'
import ProjectDisplayComp from '@/components/project/ProjectDisplayComp.vue'
import { getMorphoBankStatsText } from '@/utils/project'

const route = useRoute()
const projectsStore = usePublicProjectsStore()
let idx = 0

onMounted(async () => {
  await projectsStore.fetchProjectAuthor()
  await projectsStore.fetchMorphoBankStats()
})

// normalize the string (convert diacritics to ascii chars)
// then return the first char
function getNormalizedCharAt1(str) {
  return str
    .split('|')[1]
    .charAt(0)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

let prev_char = ''

const morphoBankStatsText = computed(() => {
  return getMorphoBankStatsText(projectsStore.morphoBankStats, true)
})
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="!projectsStore.err ? null : 'No project authors available.'"
  >
    <div class="mb-3">
      {{ morphoBankStatsText }}
    </div>

    <div class="d-flex justify-content-between">
      <ProjectMenuComp menuItem="author"></ProjectMenuComp>
    </div>

    <div v-if="projectsStore.authors != ''">
      <div class="mb-3 text-black-50 fw-bold">
        {{ Object.keys(projectsStore.authors['authors']).length }} scientists have
        published data in MorphoBank
      </div>

      <div class="d-grid gap-2 d-sm-flex _offset2" id="top">
        <div :key="n" v-for="(char, n) in projectsStore.authors.chars">
          <a :href="`#${char}`" class="fw-bold">{{ char }}</a>
        </div>
      </div>

      <div :key="n" v-for="(author, n) in projectsStore.authors['authors']">
        <div class="fw-bold mt-3" v-if="prev_char != getNormalizedCharAt1(n)">
          <a :id="`${getNormalizedCharAt1(n)}`" href="#top">
            <p class="_offset">
              {{ (prev_char = getNormalizedCharAt1(n)) }}
            </p>
          </a>
        </div>

        <div class="accordion mb-2" :id="`accordion${idx}`">
          <div class="accordion-item">
            <h2 class="accordion-header" :id="`heading${idx}`">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                :data-bs-target="`#collapse${idx}`"
                aria-expanded="true"
                :aria-controls="`collapse${idx}`"
              >
                <div class="text-mb fw-bold">{{ n.replace('|', ' ') }}</div>
                <div style="width: 5px"></div>
                <small>
                  ({{
                    projectsStore.authors['authors'][n].length + ` projects`
                  }})
                </small>
              </button>
            </h2>
            <div
              :id="`collapse${idx}`"
              class="accordion-collapse collapse"
              :aria-labelledby="`heading${idx++}`"
            >
              <div class="accordion-body p-2">
                <div
                  v-for="(project, n) in projectsStore.authors['authors'][n]"
                  :key="n"
                  class="mb-2"
                >
                  <ProjectDisplayComp 
                    :project="project" 
                    :showProjectLabel="true" 
                  />
                </div>
              </div>
            </div>
          </div>
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
