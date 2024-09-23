<script setup>
import { useRoute } from 'vue-router'
import startMatrixViewer from '@/lib/matrix-editor/startMatrixViewer'
import '@/assets/css/matrixEditor.css'

const route = useRoute()
const projectId = parseInt(route.params.projectId, 10)
const matrixId = parseInt(route.params.matrixId, 10)
const isStreaming = false
const published = true

startMatrixViewer(
  projectId,
  matrixId,
  isStreaming,
  import.meta.env.VITE_API_URL,
  published
)
</script>
<template></template>
