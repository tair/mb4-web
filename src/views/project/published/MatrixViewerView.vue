<script setup>
import { useRoute } from 'vue-router'
import startMatrixViewer from '@/lib/matrix-editor/startMatrixViewer'
import '@/assets/css/matrixEditor.css'
import { onMounted } from 'vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const projectId = parseInt(route.params.projectId, 10)
const matrixId = parseInt(route.params.matrixId, 10)
const isStreaming = false
const published = route.meta.published // Use published status from route guard, NO fallback for security

// Security check: If published status is not set by route guard, something is wrong
if (published === undefined || published === null) {
  console.error('SECURITY ERROR: Published status not set by route guard!')
  throw new Error('Access denied: Project publication status not verified')
}

onMounted(() => {
  // Track individual matrix view
  if (projectId && matrixId) {
    logView({
      project_id: projectId,
      hit_type: HIT_TYPES.MATRIX,
      row_id: matrixId,
    })
  }
})

startMatrixViewer(
  projectId,
  matrixId,
  isStreaming,
  import.meta.env.VITE_API_URL,
  published
)
</script>
<template></template>
