<script setup>
import { ref, onMounted } from 'vue'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore.js'
import GenericLoaderComp from '../../components/project/GenericLoaderComp.vue'
import ProjectMenuComp from '../../components/project/ProjectMenuComp.vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const projectsStore = usePublicProjectsStore()
let sort_by = ref('asc')
let is_asc = ref(true)

onMounted(() => {
  projectsStore.fetchProjectStats()
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
            <div class="row p-0 m-0">
              <div class="col-2 small">Project {{ item.project_id }}:</div>
              <div class="col">
                <RouterLink
                  :to="`/project/${item.project_id}/overview`"
                  class="nav-link p-0"
                >
                  <div v-html="item.name"></div>
                </RouterLink>
              </div>
            </div>
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
            <div class="row p-0 m-0">
              <div class="col-2 small">Project {{ item.project_id }}:</div>
              <div class="col">
                <RouterLink
                  :to="`/project/${item.project_id}/overview`"
                  class="nav-link p-0"
                >
                  <div v-html="item.name"></div>
                </RouterLink>
              </div>
            </div>

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
                  :to="`/project/${item.doc_id}/overview`"
                  class="nav-link p-0"
                >
                  <div v-html="item.doc"></div>
                </RouterLink>
              </div>
            </div>
            <div class="row p-0 m-0">
              <div class="col-2 small">Project {{ item.project_id }}:</div>
              <div class="col">
                <RouterLink
                  :to="`/project/${item.project_id}/overview`"
                  class="nav-link p-0"
                >
                  <div v-html="item.project"></div>
                </RouterLink>
              </div>
            </div>

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
                  :to="`/project/${item.doc_id}/overview`"
                  class="nav-link p-0"
                >
                  <div v-html="item.matrix"></div>
                </RouterLink>
              </div>
            </div>
            <div class="row p-0 m-0">
              <div class="col-2 small">Project {{ item.project_id }}:</div>
              <div class="col">
                <RouterLink
                  :to="`/project/${item.project_id}/overview`"
                  class="nav-link p-0"
                >
                  <div v-html="item.project"></div>
                </RouterLink>
              </div>
            </div>

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
