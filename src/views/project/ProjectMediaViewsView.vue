<script setup>
import { onMounted } from "vue";
import { useProjectStore } from "@/stores/storeProjectDetails.js";
import ProjectLoaderComp from "../../components/project/ProjectLoaderComp.vue";
import { useRoute } from "vue-router";
const route = useRoute();
const projectStore = useProjectStore();
const project_id = route.params.id;
onMounted(() => {
  projectStore.fetchProject(project_id);
});
</script>

<template>
  <ProjectLoaderComp
    :project_id="project_id"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.media_views ? null : 'No media views data available.'
    "
    itemName="media_views"
  >
    <ul class="list-group">
      <li
        :key="n"
        v-for="(view, n) in projectStore.media_views"
        class="list-group-item"
      >
        {{ view }}
      </li>
    </ul>
  </ProjectLoaderComp>
</template>
