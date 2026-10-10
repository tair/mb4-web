<script setup lang="ts">
import PublishedProjectSideNav from '@/components/project/PublishedProjectSideNav.vue'
import ProjectTitleComp from '@/components/project/ProjectTitleComp.vue'
import { computed, onUnmounted } from 'vue'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'

const projectStore = usePublicProjectDetailsStore()

const props = defineProps<{
  isLoading: boolean
  errorMessage?: string | null
  basePath: string
  projectId?: string | number
}>()

// Only trust the store's error when it belongs to the project being shown.
const storeError = computed(() =>
  !props.projectId || String(props.projectId) === projectStore.project_id
    ? projectStore.err
    : null
)

// Stop polling for a not-yet-prepared project once its pages are left; a
// remount fetches again and resumes polling if still needed.
onUnmounted(() => projectStore.clearNotReady())
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
        <div v-if="projectStore.notReady" class="py-3">
          <div class="spinner-border spinner-border-sm text-success me-2"></div>
          This project was published recently and its public pages are still
          being prepared. This page will update automatically.
        </div>
        <div v-else-if="storeError || errorMessage">
          <strong>{{ storeError || errorMessage }}</strong>
        </div>
        <div v-else>
          <ProjectTitleComp></ProjectTitleComp>
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
