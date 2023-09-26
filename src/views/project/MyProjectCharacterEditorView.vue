<script setup="ts">
import { useRoute } from 'vue-router'
import startCharacterEditor from '@/lib/matrix-editor/startCharacterEditor'
import '@/assets/css/matrixEditor.css'

const route = useRoute()
const projectId = parseInt(route.params.projectId, 10)
const matrixId = parseInt(route.params.matrixId, 10)

startCharacterEditor(projectId, matrixId, import.meta.env.VITE_API_URL)
</script>
<template></template>