<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { batchSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = parseInt(route.params.id)

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

async function createBatch(event) {
  const formData = new FormData(event.currentTarget)

  try {
    const success = await mediaStore.createBatch(projectId, formData)
    if (!success) {
      alert('Failed to create media. Please check your input and try again.')
      return
    }

    router.push({ path: `/myprojects/${projectId}/media` })
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      'Failed to create media. Please try again.'
    alert(errorMessage)
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
  <header>
    <div class="text_block">
      <span style="font-size: 18px">
        <b>Add Batch of 2D Media</b>
        <b>Step 1:</b> Load a zipped media file <b>Step 2:</b> Curate
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
        <strong>Note:</strong> Due to file size considerations you should upload
        3d media (PLY, STL, ZIP-format TIFF and DCM stacks) one at a time using
        the
        <RouterLink :to="`/myprojects/${projectId}/media/create`"
          >standard media upload form</RouterLink
        >
      </div>
    </div>
  </header>
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="createBatch">
      <div class="row setup-content">
        <template v-for="(definition, index) in batchSchema" :key="index">
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
          <button class="btn btn-primary" type="button" @click="$router.go(-1)">
            Cancel
          </button>
          <button class="btn btn-primary" type="submit">Upload Batch</button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
