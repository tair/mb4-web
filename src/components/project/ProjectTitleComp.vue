<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
const projectStore = usePublicProjectDetailsStore()
</script>

<template>
  <div v-if="projectStore.overview">
    <div class="fw-bold mb-3">
      Project {{ projectStore.overview.project_id }}:
      {{ projectStore.overview.article_authors }}.
      {{ projectStore.overview.journal_year }}.
      {{ projectStore.overview.article_title }}.
      {{ projectStore.overview.journal_title }}.
      {{ projectStore.overview.journal_volume }} ({{
        projectStore.overview.journal_number
      }}): {{ projectStore.overview.article_pp }}.
    </div>
  </div>
  <div v-else>
    <strong>Project title information not available.</strong>
  </div>
</template>
