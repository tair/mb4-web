<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id

function getMatrixUrl(matrixId) {
  return `/project/${projectId}/matrices/${matrixId}/view`
}

function getCountsMessage(counts) {
  if (!counts) return null
  const fields = {
    cell: 'scorings',
    taxa: 'taxa',
    character: 'characters',
    cell_media: 'cell images',
    media_label: 'labels attached to cell images',
    character_media: 'character images',
  }
  const messages = []
  for (const field in fields) {
    if (counts[field]) {
      messages.push(`${counts[field]} ${fields[field]}`)
    }
  }
  return messages.join('; ')
}

function getHitMessage(hits, downloads) {
  const messages = []
  if (hits) messages.push(`Viewed ${hits} times`)
  if (downloads) messages.push(`Downloaded ${downloads} times`)
  return messages.join('; ')
}

function getDOILink(doi) {
  return `http://dx.doi.org/${doi}`
}

onMounted(() => {
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.matrices ? null : 'No matrix data available.'"
    basePath="project"
  >
    <p>
      This project has
      {{ projectStore.matrices?.length }}
      {{
        projectStore.matrices?.length && projectStore.matrices?.length > 1
          ? 'matrices'
          : 'matrix'
      }}.
    </p>
    <div :key="n" v-for="(matrix, n) in projectStore.matrices" class="card p-4">
      <div class="header-row">
        <span
          ><b>{{ matrix.title }}</b></span
        >
        <router-link
          :to="getMatrixUrl(matrix.matrix_id)"
          tag="a"
          target="_blank"
        >
          <button class="btn btn-primary">View matrix</button>
        </router-link>
      </div>
      <div class="mt-3">
        <p>{{ getCountsMessage(matrix.counts) }}</p>
        <p>{{ getHitMessage(matrix.hits, matrix.downloads) }}</p>
        <p v-if="matrix.doi">
          Matrix doi: {{ matrix.doi }},
          <a :href="getDOILink(matrix.doi)" target="_blank">{{
            getDOILink(matrix.doi)
          }}</a>
        </p>
      </div>
      <hr />
      <div class="">
        <p><b>Download options</b></p>
      </div>
    </div>
  </ProjectLoaderComp>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
