<script setup>
import { onMounted } from 'vue'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '../../components/project/ProjectLoaderComp.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :projectId="projectId"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.bibliography ? null : 'No bibliography data available.'
    "
    basePath="project"
    itemName="bibliography"
  >
    This project has {{ projectStore.bibliography?.length }} bibliographic
    references.

    <ul class="list-group">
      <li
        :key="n"
        v-for="(b, n) in projectStore.bibliography"
        :class="[
          n % 2 != 0 ? 'list-group-item-secondary' : '',
          'list-group-item',
        ]"
      >
        {{ b.authors }} {{ b.pubyear }}. {{ b.article_title }}.
        <em>{{ b.journal_title }}.</em>
        Vol {{ b.vol }}, pp, {{ b.collation }}.
      </li>
    </ul>
  </ProjectLoaderComp>
</template>
