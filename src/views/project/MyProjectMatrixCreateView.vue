<script setup>
import { useRoute } from 'vue-router'

import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()

const projectId = route.params.id
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    basePath="myprojects"
    itemName="matrices"
  >
  </ProjectContainerComp>
</template>
<style scoped></style>
