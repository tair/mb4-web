<script setup>
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import startMatrixEditor from '@/lib/matrix-editor/startMatrixEditor'
import '@/assets/css/matrixEditor.css'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectId = parseInt(route.params.projectId, 10)
const matrixId = parseInt(route.params.matrixId, 10)
const isStreaming = false

let editor = null

onMounted(() => {
  editor = startMatrixEditor(
    projectId,
    matrixId,
    isStreaming,
    apiService.buildUrl('')
  )
})

onUnmounted(() => {
  editor?.dispose()
  editor = null
})
</script>
<template></template>
