<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'

const route = useRoute()
const projectId = route.params.id
const projectStore = usePublicProjectDetailsStore()

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.taxa_details ? null : 'No taxa data available.'"
    basePath="project"
  >
    <p>
      This project has
      {{ projectStore.taxa_details?.taxa_browser?.length }} taxa.
    </p>

    <div class="row">
      <div class="col-8">
        <ul class="list-group">
          <li
            :key="n"
            v-for="(taxa, n) in projectStore.taxa_details?.taxa_browser"
            class="list-group-item"
          >
            {{ taxa.genus }} {{ taxa.specific_epithet }}
          </li>
        </ul>
      </div>
      <div class="col-4">
        <h5>Taxon Partition</h5>
        <select class="form-select" size="5">
          <option v-for="p in projectStore.partitions" value="3">
            {{ p.name }}
          </option>
        </select>
      </div>
    </div>
  </ProjectLoaderComp>
</template>
