<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.docs ? null : 'No documents data available.'"
    basePath="project"
  >
    <div :key="n" v-for="(fld, n) in projectStore.docs">
      <div data-bs-toggle="collapse" :href="`#collapse${n}`" role="button">
        <strong>{{ fld.title }}</strong>
      </div>
      <div class="collapse" :id="`collapse${n}`">
        <!-- {{ fld.docs }} -->
        <div :key="d" v-for="(doc, d) in fld.docs">
          {{ doc.title }}
        </div>
      </div>
    </div>
  </ProjectLoaderComp>
</template>
