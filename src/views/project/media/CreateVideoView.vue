<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { videoSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const isUploading = ref(false)

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

async function createVideoMedia(event) {
  if (isUploading.value) return // Prevent double submission
  
  isUploading.value = true
  try {
    const formData = new FormData(event.currentTarget)
    const success = await mediaStore.createVideo(projectId, formData)
    if (!success) {
      alert('Failed to create video media')
      return
    }

    router.push({ path: `/myprojects/${projectId}/media` })
  } catch (error) {
    console.error('Video upload error:', error)
    alert('Failed to create video media')
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  if (!mediaStore.isLoaded) {
    mediaStore.fetchMedia(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <div class="text_block">
        <span style="font-size: 18px">
          <b>Upload Video Media</b>
        </span>
        <span>
          Did you add your
          <RouterLink :to="`/myprojects/${projectId}/specimens/`"
            >specimens</RouterLink
          >
          and
          <RouterLink :to="`/myprojects/${projectId}/views/`">views</RouterLink>
          first?
        </span>
        <div>
          <strong>Note:</strong> Supported video formats include MP4, MOV, AVI, WebM, MKV, WMV, FLV, and M4V.
          Video thumbnails will be automatically generated during upload processing.
        </div>
      </div>
    </header>
    <form @submit.prevent="createVideoMedia">
      <div class="row setup-content">
        <template v-for="(definition, index) in videoSchema" :key="index">
          <div v-if="!definition.existed" class="form-group">
            <label :for="index" class="form-label">
              {{ definition.label }}
            </label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              v-bind="definition.args"
            >
            </component>
          </div>
        </template>
        <div class="btn-form-group">
          <button
            class="btn btn-outline-primary"
            type="button"
            @click="$router.go(-1)"
            :disabled="isUploading"
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit" :disabled="isUploading">
            <span v-if="isUploading">
              <i class="fa fa-spinner fa-spin"></i>
              Uploading Video...
            </span>
            <span v-else>Upload Video</span>
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>