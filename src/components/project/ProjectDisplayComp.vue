<template>
  <div class="project-display">
    <!-- Optional Project ID Label -->
    <div v-if="showProjectLabel" class="row p-0 m-0">
      <div class="col-2 small">Project {{ projectId }}:</div>
      <div class="col">
        <RouterLink
          :to="`/project/${projectId}/overview`"
          :class="linkClass"
        >
          <div v-html="displayTitle"></div>
          <span v-if="hasAuthorInfo" class="text-muted small">
            <template v-if="project.article_authors">{{ project.article_authors }}</template>
            <template v-if="project.journal_year">({{ project.journal_year }})</template>
            <template v-if="project.journal_title">. {{ project.journal_title }}</template>
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Simple Display (no Project ID label) -->
    <RouterLink
      v-else
      :to="`/project/${projectId}/overview`"
      :class="linkClass"
    >
      <div v-html="displayTitle"></div>
      <span v-if="hasAuthorInfo" class="text-muted small">
        <template v-if="project.article_authors">{{ project.article_authors }}</template>
        <template v-if="project.journal_year">({{ project.journal_year }})</template>
        <template v-if="project.journal_title">. {{ project.journal_title }}</template>
      </span>
    </RouterLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  showProjectLabel: {
    type: Boolean,
    default: false
  },
  linkClass: {
    type: String,
    default: 'nav-link p-0'
  }
})

// Handle both project_id and id field variations
const projectId = computed(() => {
  return props.project.project_id || props.project.id
})

// Use article_title as primary, fallback to name
const displayTitle = computed(() => {
  return props.project.article_title || props.project.name || props.project.project
})

// Check if any author information exists
const hasAuthorInfo = computed(() => {
  return props.project.article_authors || 
         props.project.journal_year || 
         props.project.journal_title
})
</script>

<style scoped>
.project-display {
  /* Any specific styling if needed */
}
</style>
