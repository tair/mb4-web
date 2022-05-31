<script setup>
import { onMounted } from "vue";
import { useProjectStore } from "@/stores/storeProjectDetails.js";
import ProjectLoaderComp from "../../components/project/ProjectLoaderComp.vue";
import { useRoute } from "vue-router";
const route = useRoute();
const project_id = route.params.id;
const projectStore = useProjectStore();

onMounted(() => {
  projectStore.fetchProject(project_id);
});
</script>

<template>
  <ProjectLoaderComp
    :project_id="project_id"
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.taxa_details ? null : 'No taxa data available.'"
    itemName="taxa"
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
