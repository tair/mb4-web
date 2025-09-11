<script setup>
import { useRoute } from 'vue-router'
import startCharacterEditor from '@/lib/matrix-editor/startCharacterEditor'
import '@/assets/css/matrixEditor.css'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectId = parseInt(route.params.projectId, 10)
const matrixId = parseInt(route.params.matrixId, 10)

startCharacterEditor(projectId, matrixId, apiService.buildUrl(''))
</script>
<template></template>
