<script setup>
import ProjectSideNav from "@/views/project/ProjectSideNav.vue";
import ProjectTitleComp from "@/components/project/ProjectTitleComp.vue";

const props = defineProps({
  project_id: {
    type: [Number, String],
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  errorMessage: String,
  itemName: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="py-5" v-if="isLoading">
    <div class="spinner-border text-success" role="status"></div>
    Loading...
  </div>
  <div v-else>
    <div class="row">
      <div class="col-2 border-end">
        <ProjectSideNav
          :project_id="project_id"
          :item="itemName"
        ></ProjectSideNav>
      </div>

      <div class="col-10">
        <div v-if="!errorMessage">
          <ProjectTitleComp></ProjectTitleComp>
          <slot />
        </div>
        <div v-else>
          <strong>{{ errorMessage }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>
