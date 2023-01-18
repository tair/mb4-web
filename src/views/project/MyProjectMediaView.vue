<script setup>
import { useRoute } from 'vue-router'

import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id
</script>

<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="false"
    :errorMessage="null"
    basePath="myprojects"
    itemName="media"
  >
    Media
  </ProjectContainerComp>
</template>
