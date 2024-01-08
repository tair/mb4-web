<script setup lang="ts">
import ProjectSideNav from '@/components/project/ProjectSideNav.vue'

defineProps<{
  projectId: string | number
  isLoading: boolean
  errorMessage: string
  basePath: string
}>()
</script>
<template>
  <div class="row">
    <div class="col-2 border-end">
      <ProjectSideNav :basePath="basePath"></ProjectSideNav>
    </div>
    <div class="py-5 col-10" v-if="isLoading">
      <div class="spinner-border text-success" role="status"></div>
      Loading...
    </div>
    <div v-else class="col-10">
      <slot></slot>
    </div>
  </div>
</template>
