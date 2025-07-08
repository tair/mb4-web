<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import FolioMediaComp from '@/components/project/FolioMediaComp.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()

const mediaStore = usePublicMediaStore()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const folioId = route.params.folioId
const folioInfo = ref(null)
const mediaFiles = ref(null)

onMounted(() => {
  projectStore
    .fetchProject(projectId)
    .then(() => {
      folioInfo.value = projectStore.getFolioInfo(folioId)
    })
    .then(() => {
      mediaStore.fetchMediaFiles(projectId).then(() => {
        mediaFiles.value = mediaStore.getMediaFilesByIdList(
          folioInfo.value?.media_files
        )
      })
    })
  
  // Track folio view only when there's a specific folio ID
  if (projectId && folioId) {
    logView({ project_id: projectId, hit_type: HIT_TYPES.FOLIO, row_id: folioId })
  }
})

function generateFoliosListRoute() {
  return `/project/${projectId}/folios`
}
</script>

<template>
  <ProjectLoaderComp
    :isLoading="mediaStore.isLoading"
    :errorMessage="mediaStore.media_files ? null : 'No media data available.'"
    basePath="project"
  >
    <p>
      <router-link :to="generateFoliosListRoute()"
        >&lt;&lt; Back to Folios List</router-link
      >
    </p>
    <p>
      Viewing
      <span class="fw-bold"
        >Folio F{{ folioInfo?.folio_id }} {{ folioInfo?.name }}</span
      >
      containing {{ mediaFiles?.length }} media.
    </p>
    <p>
      {{ folioInfo?.description }}
    </p>
    <div class="row row-cols-auto g-2 py-3 justify-content-start">
      <div
        v-if="mediaFiles && mediaFiles.length > 0"
        class="col d-flex align-items-stretch"
        v-for="(mediaFile, n) in mediaFiles"
        :key="n"
      >
        <FolioMediaComp :media_file="mediaFile" :project_id="projectId"></FolioMediaComp>
      </div>
    </div>
  </ProjectLoaderComp>
</template>
