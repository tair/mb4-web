<script setup="ts">
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import startMatrixEditor from '@/lib/matrix-editor/startMatrixEditor'
import '@/assets/css/matrixEditor.css'

const route = useRoute()
const projectId = parseInt(route.params.projectId, 10)
const matrixId = parseInt(route.params.matrixId, 10)
const isStreaming = false

onMounted(() => {
  startMatrixEditor(
    projectId,
    matrixId,
    isStreaming,
    import.meta.env.VITE_API_URL
  )
})

onUnmounted(() => {})
</script>
<template></template>
