<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'

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
    :errorMessage="
      projectStore.specimen_details ? null : 'No specimen data available.'
    "
    basePath="project"
  >
    <p>
      This project has
      {{ projectStore.specimen_details?.length }} specimens.
    </p>

    <ul class="list-group">
      <li
        :key="n"
        v-for="(specimen, n) in projectStore.specimen_details"
        class="list-group-item"
      >
        {{ specimen.genus }} {{ specimen.specific_epithet }}
      </li>
    </ul>

    <!-- <div class="col-4">
            <h5>Taxon Partition</h5>
            <select class="form-select" size="5">
              <option v-for="p in projectStore.partitions" value="3">
                {{ p.name }}
              </option>
            </select>
          </div> -->
  </ProjectLoaderComp>
</template>
