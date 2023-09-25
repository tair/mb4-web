<script setup>
import { useRoute } from 'vue-router'
import startMatrixEditor from '@/lib/matrix-editor/startMatrixEditor'
import '@/assets/css/matrixEditor.css'

const route = useRoute()
const projectId = route.params.projectId
const matrixId = route.params.matrixId
const isStreaming = false
const isSyncing = false

startMatrixEditor({
  p: projectId,
  m: matrixId,
  s: isStreaming,
  c: isSyncing,
  l: import.meta.env.VITE_API_URL,
})
</script>
<template></template>
