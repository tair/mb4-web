<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import { getViewStatsTooltipText } from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id

onMounted(() => {
  projectStore.fetchProject(projectId)
})

function getPermalink(folioId) {
  return `${import.meta.env.VITE_HOST}/permalink/?F${folioId}`
}

function getFolioViewCount(folioId) {
  return projectStore.getFolioViewCount(folioId)
}

function generateFolioViewRoute(folioId) {
  return `/project/${projectId}/folios/${folioId}`
}

const viewStatsTooltipText = getViewStatsTooltipText()
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.matrices ? null : 'No folios available.'"
    basePath="project"
  >
    <div class="mb-3">
      This project has {{ projectStore.folios?.length }} folios.
    </div>
    <div>
      <ul class="list-group mt-2">
        <li
          :key="n"
          v-for="(folio, n) in projectStore.folios"
          :class="[
            n % 2 != 0 ? 'list-group-item-secondary' : '',
            'list-group-item',
          ]"
        >
          <span class="fw-bold">{{ 'F' + folio.folio_id }}</span>
          {{ folio.name }} (<a :href="getPermalink(folio.folio_id)">Permalink</a
          >)
          <span v-if="getFolioViewCount(folio.folio_id)"
            >(Viewed {{ getFolioViewCount(folio.folio_id) }} times
            <Tooltip :content="viewStatsTooltipText"></Tooltip>)</span
          >
          <router-link
            :to="generateFolioViewRoute(folio.folio_id)"
            class="right-align"
          >
            View Folio Media
          </router-link>
        </li>
      </ul>
    </div>
  </ProjectLoaderComp>
</template>

<style>
.right-align {
  float: right;
}
</style>
