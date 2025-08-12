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
const published = true

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
