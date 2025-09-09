<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import MediaDetailsComp from '@/components/project/MediaDetailsComp.vue'
import { logView, HIT_TYPES } from '@/lib/analytics.js'

const route = useRoute()
const router = useRouter()

const mediaStore = usePublicMediaStore()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const mediaId = route.params.mediaId

const mediaFile = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    // Ensure project details are loaded
    await projectStore.fetchProject(projectId)
    
    // Fetch media files if not already loaded
    await mediaStore.fetchMediaFiles(projectId)
    
    // Get the specific media file
    const specificMedia = mediaStore.getMediaFileById(mediaId)
    
    if (!specificMedia) {
      error.value = `Media file M${mediaId} not found in this project.`
      return
    }
    
    mediaFile.value = specificMedia
    
    // Track media view
    if (projectId && mediaId) {
      logView({
        project_id: projectId,
        hit_type: HIT_TYPES.MEDIA,
        row_id: mediaId,
      })
    }
  } catch (e) {
    console.error('Error loading media detail:', e)
    error.value = 'Error loading media details.'
  } finally {
    loading.value = false
  }
})

const backToMediaList = () => {
  router.push({ name: 'ProjectMediaView', params: { id: projectId } })
}

const projectTitle = computed(() => {
  return projectStore.overview?.title || `Project ${projectId}`
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="loading"
    :errorMessage="error"
    basePath="project"
  >
    <div class="container-fluid">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link :to="{ name: 'ProjectOverviewView', params: { id: projectId } }">
              {{ projectTitle }}
            </router-link>
          </li>
          <li class="breadcrumb-item">
            <a href="#" @click.prevent="backToMediaList">Media</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            M{{ mediaId }}
          </li>
        </ol>
      </nav>
      
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <h4>Media Detail: M{{ mediaId }}</h4>
        </div>
      </div>
      
      <!-- Media Details Component -->
      <div v-if="mediaFile">
        <MediaDetailsComp
          :media_file="mediaFile"
          :project_id="projectId"
          :use-annotation-link-id="false"
          :is-project-published="true"
        />
      </div>
      
      <div v-else-if="!loading && !error" class="alert alert-warning">
        Media file M{{ mediaId }} not found in this project.
      </div>
    </div>
  </ProjectLoaderComp>
</template>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: ">";
}

.container-fluid {
  padding: 1rem;
}
</style>
