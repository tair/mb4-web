<script setup>
import ProjectSideNav from '@/components/project/ProjectSideNav.vue'

const props = defineProps({
  projectId: {
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
  basePath: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="row">
    <div class="col-2 border-end">
      <ProjectSideNav
        :projectId="projectId"
        :item="itemName"
        :basePath="basePath"
      ></ProjectSideNav>
    </div>
    <div class="py-5 col-10" v-if="isLoading">
      <div class="spinner-border text-success" role="status"></div>
      Loading...
    </div>
    <div v-else class="col-10">
      <slot />
    </div>
  </div>
</template>
