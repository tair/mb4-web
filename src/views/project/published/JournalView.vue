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
  await projectsStore.fetchProjectJournal()
  await projectsStore.fetchMorphoBankStats()
})

// normalize the string (convert diacritics to ascii chars)
// then return the first char
function getNormalizedCharAt1(str) {
  try {
    return str
      .charAt(0)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  } catch (e) {
    return str
  }
}

let prev_char = ''

const morphoBankStatsText = computed(() => {
  return getMorphoBankStatsText(projectsStore.morphoBankStats, true)
})
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="!projectsStore.err ? null : 'No project journals available.'"
  >
    <div class="mb-3">
      {{ morphoBankStatsText }}
    </div>

    <div class="d-flex justify-content-between">
      <ProjectMenuComp menuItem="publication"></ProjectMenuComp>
    </div>

    <div v-if="projectsStore.journals != ''">
      <div class="mb-3 text-black-50 fw-bold">
        {{ Object.keys(projectsStore.journals['journals']).length }} journals
        have published data in MorphoBank
      </div>

      <div class="alphabet-nav d-grid gap-2 d-sm-flex" id="top">
        <div :key="n" v-for="(char, n) in projectsStore.journals.chars">
          <a :href="`#${char}`" class="fw-bold">{{ char }}</a>
        </div>
      </div>

      <div :key="n" v-for="(author, n) in projectsStore.journals['journals']">
        <div
          class="letter-section fw-bold mt-3"
          v-if="
            /[a-zA-Z]/.test(getNormalizedCharAt1(n)) &&
            prev_char != getNormalizedCharAt1(n)
          "
          :id="`${getNormalizedCharAt1(n)}`"
          style="scroll-margin-top: 140px;"
        >
          <a href="#top" class="letter-anchor">
            {{ (prev_char = getNormalizedCharAt1(n)) }}
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
                    projectsStore.journals['journals'][n].length + ` projects`
                  }})
                </small>
              </button>
            </h2>
            <div
              :id="`collapse${idx}`"
              class="accordion-collapse collapse"
              :aria-labelledby="`heading${idx++}`"
            >
              <div class="accordion-body p-0">
                <ul
                  class="list-group list-group-flush"
                  v-for="(project, n) in projectsStore.journals['journals'][n]"
                  :key="n"
                >
                  <li
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
        </div>
      </div>
    </div>
  </GenericLoaderComp>
</template>

<style scoped>
.alphabet-nav {
  position: sticky;
  top: 75px;
  background-color: #fff;
  padding: 12px 0;
  margin: 0 -12px;
  padding-left: 12px;
  padding-right: 12px;
  z-index: 50;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.letter-anchor {
  display: block;
  scroll-margin-top: 180px;
}
</style>
