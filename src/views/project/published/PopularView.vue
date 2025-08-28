<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore.js'
import { getMorphoBankStatsText } from '@/utils/project'
import GenericLoaderComp from '@/components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '@/components/project/ProjectMenuComp.vue'
import ProjectDisplayComp from '@/components/project/ProjectDisplayComp.vue'

const route = useRoute()
const projectsStore = usePublicProjectsStore()
let sort_by = ref('asc')
let is_asc = ref(true)

onMounted(async () => {
  await projectsStore.fetchProjectStats()
  await projectsStore.fetchMorphoBankStats()
})

const morphoBankStatsText = computed(() => {
  return getMorphoBankStatsText(projectsStore.morphoBankStats, true)
})
</script>

<template>
  <GenericLoaderComp
    :isLoading="projectsStore.isLoading"
    :errorMessage="
      !projectsStore.err ? null : 'No project statistics data available.'
    "
  >
    <div class="mb-3">
      {{ morphoBankStatsText }}
    </div>

    <div class="d-flex justify-content-between">
      <ProjectMenuComp menuItem="popular"></ProjectMenuComp>
    </div>

    <div class="h5 fw-bold text-mb">
      Here is what's been trending on MorphoBank over the last 30 days...
    </div>

    <h5 class="mt-5">Most Viewed Projects</h5>
    <div class="overflow-auto border" style="height: 300px">
      <div
        class="list-group list-group-flush"
        :key="n"
        v-for="(item, n) in projectsStore.stats?.projectViewsForLast30Days"
      >
        <div class="list-group-item p-0 m-0">
          <div class="py-2 m-0" style="border-bottom: 1px solid #e0e0e0">
            <ProjectDisplayComp 
              :project="item" 
              :showProjectLabel="true" 
            />
            <div class="row p-0 m-0">
              <div class="col-2 small">Views:</div>
              <div class="col">{{ item.views }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h5 class="mt-5">Most Viewed Media</h5>
    <div class="overflow-auto border" style="height: 300px">
      <div
        class="list-group list-group-flush"
        :key="n"
        v-for="(item, n) in projectsStore.stats?.mediaViewsForLast30Days"
      >
        <div class="list-group-item p-0 m-0">
          <div class="py-2 m-0" style="border-bottom: 1px solid #e0e0e0">
            <div class="row p-0 m-0">
              <div class="col-2 small">Media</div>
              <div class="col">
                {{ item.media_id }}
              </div>
            </div>
            <ProjectDisplayComp 
              :project="item" 
              :showProjectLabel="true" 
            />

            <div class="row p-0 m-0">
              <div class="col-2 small">Views:</div>
              <div class="col">{{ item.views }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h5 class="mt-5">Most Downloaded Documents</h5>
    <div class="overflow-auto border" style="height: 300px">
      <div
        class="list-group list-group-flush"
        :key="n"
        v-for="(item, n) in projectsStore.stats?.docDownloadsForLast30Days"
      >
        <div class="list-group-item p-0 m-0">
          <div class="py-2 m-0" style="border-bottom: 1px solid #e0e0e0">
            <div class="row p-0 m-0">
              <div class="col-2 small">Document</div>
              <div class="col">
                <RouterLink
                  :to="`/project/${item.project_id}/documents`"
                  class="nav-link p-0"
                >
                  <div v-html="item.doc"></div>
                </RouterLink>
              </div>
            </div>
            <ProjectDisplayComp 
              :project="item" 
              :showProjectLabel="true" 
            />

            <div class="row p-0 m-0">
              <div class="col-2 small">Downloads:</div>
              <div class="col">{{ item.downloads }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h5 class="mt-5">Most Downloaded Matrices</h5>
    <div class="overflow-auto border" style="height: 300px">
      <div
        class="list-group list-group-flush"
        :key="n"
        v-for="(item, n) in projectsStore.stats?.matrixDownloadsForLast30Days"
      >
        <div class="list-group-item p-0 m-0">
          <div class="py-2 m-0" style="border-bottom: 1px solid #e0e0e0">
            <div class="row p-0 m-0">
              <div class="col-2 small">Matrix {{ item.matrix_id }}</div>
              <div class="col">
                <RouterLink
                  :to="`/project/${item.project_id}/matrices`"
                  class="nav-link p-0"
                >
                  <div v-html="item.matrix"></div>
                </RouterLink>
              </div>
            </div>
            <ProjectDisplayComp 
              :project="item" 
              :showProjectLabel="true" 
            />

            <div class="row p-0 m-0">
              <div class="col-2 small">Downloads:</div>
              <div class="col">{{ item.downloads }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-5"></div>
  </GenericLoaderComp>
</template>
