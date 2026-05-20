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
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    await projectStore.fetchProject(projectId)
    folioInfo.value = projectStore.getFolioInfo(folioId)

    if (!folioInfo.value) {
      error.value = `Folio F${folioId} not found in this project.`
      return
    }

    await mediaStore.fetchMediaFiles(projectId)
    mediaFiles.value = mediaStore.getMediaFilesByIdList(
      folioInfo.value?.media_files
    )

    if (projectId && folioId) {
      logView({
        project_id: projectId,
        hit_type: HIT_TYPES.FOLIO,
        row_id: folioId,
      })
    }
  } catch (e) {
    console.error('Error loading folio detail:', e)
    error.value = 'Error loading folio media.'
  } finally {
    loading.value = false
  }
})

function generateFoliosListRoute() {
  return `/project/${projectId}/folios`
}
</script>

<template>
  <ProjectLoaderComp
    :isLoading="loading"
    :errorMessage="error"
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
        <FolioMediaComp
          :media_file="mediaFile"
          :project_id="projectId"
        ></FolioMediaComp>
      </div>
    </div>
  </ProjectLoaderComp>
</template>
