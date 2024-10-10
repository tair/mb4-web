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
const projectId = parseInt(route.params.id)
const mediaId = parseInt(route.params.mediaId)

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
const media = computed(() => mediaStore.getMediaById(mediaId))

async function editMedia(event) {
  const formData = new FormData(event.currentTarget)
  const success = await mediaStore.edit(projectId, mediaId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to modify media')
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
    <form @submit.prevent="editMedia">
      <div class="row setup-content">
        <div
          v-for="(definition, index) in schema"
          :key="index"
          class="form-group"
        >
          <label :for="index" class="form-label">
            {{ definition.label }}
          </label>
          <component
            :key="index"
            :is="definition.view"
            :name="index"
            :value="media[index]"
            v-bind="definition.args"
          >
          </component>
        </div>
        <div class="btn-form-group">
          <RouterLink :to="{ name: 'MyProjectMediaView' }">
            <button class="btn btn-primary" type="button">Cancel</button>
          </RouterLink>
          <button class="btn btn-primary" type="submit">Save</button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
