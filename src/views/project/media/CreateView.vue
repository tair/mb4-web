<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id

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

async function createMedia(event) {
  const formData = new FormData(event.currentTarget)
  const success = await mediaStore.create(projectId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to create media')
    return
  }

  router.push({ path: `/myprojects/${projectId}/media` })
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
    <form @submit.prevent="createMedia">
      <div class="row setup-content">
        <template v-for="(definition, index) in schema" :key="index">
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
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit">Create</button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
