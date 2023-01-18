<script setup>
import { onMounted } from 'vue'
import ProjectLoaderComp from '../../components/project/ProjectLoaderComp.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const projectId = route.params.id

onMounted(() => {

})
</script>

<template>
  <ProjectLoaderComp 
    :projectId="projectId"
    :isLoading="false"
    :errorMessage="null"
    basePath="myprojects" 
    itemName="matrices">
    There are {{ matrices?.length }} matrices associated with this project.
  </ProjectLoaderComp>
</template>