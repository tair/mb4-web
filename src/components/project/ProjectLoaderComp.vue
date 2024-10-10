<script setup lang="ts">
import PublishedProjectSideNav from '@/components/project/PublishedProjectSideNav.vue'
import ProjectTitleComp from '@/components/project/ProjectTitleComp.vue'

defineProps<{
  isLoading: boolean
  errorMessage?: string | null
  basePath: string
}>()
</script>
<template>
  <div class="py-5" v-if="isLoading">
    <div class="spinner-border text-success" role="status"></div>
    Loading...
  </div>
  <div v-else>
    <div class="row">
      <div class="col-2 border-end">
        <PublishedProjectSideNav :basePath="basePath"></PublishedProjectSideNav>
      </div>

      <div class="col-10">
        <div v-if="errorMessage">
          <strong>{{ errorMessage }}</strong>
        </div>
        <div v-else>
          <ProjectTitleComp></ProjectTitleComp>
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
