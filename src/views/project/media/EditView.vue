<script setup>
import router from '@/router'
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
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
const authStore = useAuthStore()

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)
const media = computed(() => mediaStore.getMediaById(mediaId))

// ACCESS CONTROL - Using centralized service
const accessResult = ref(null)
const restrictedFields = ref([])
const accessChecked = ref(false)

// Reactive access control check
const canEditMedia = computed(() => accessResult.value?.canEdit || false)
const accessMessage = computed(() => {
  if (!accessResult.value) return null
  return AccessControlService.getAccessMessage(
    accessResult.value,
    EntityType.MEDIA
  )
})

// Check access when data is loaded
async function checkAccess() {
  if (!media.value || !isLoaded.value || accessChecked.value) return

  // Ensure auth store is ready
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()

    // If still no access, wait a bit and try again
    if (!authStore.user?.access) {
      setTimeout(checkAccess, 100)
      return
    }
  }

  try {
    const result = await AccessControlService.canEditEntity({
      entityType: EntityType.MEDIA,
      projectId,
      entity: media.value,
    })

    accessResult.value = result
    restrictedFields.value = AccessControlService.getRestrictedFields(
      EntityType.MEDIA,
      result
    )
    accessChecked.value = true
  } catch (error) {
    console.error('Error checking access:', error)
    accessResult.value = {
      canEdit: false,
      reason: 'Error checking permissions',
      level: 'error',
    }
    accessChecked.value = true
  }
}

// Watch for when all required data becomes available
watch(
  [isLoaded, media, () => authStore.user],
  () => {
    if (
      isLoaded.value &&
      media.value &&
      authStore.user &&
      !accessChecked.value
    ) {
      checkAccess()
    }
  },
  { immediate: true }
)

// Helper function to check if a field should be disabled
function isFieldDisabled(field) {
  // Disable all fields if user can't edit the media
  if (!canEditMedia.value) return true

  // Disable restricted fields
  if (restrictedFields.value.includes(field)) return true

  return false
}

async function editMedia(event) {
  // Prevent submission if user doesn't have access
  if (!canEditMedia.value) {
    alert('You do not have permission to edit this media.')
    return
  }

  const formData = new FormData(event.currentTarget)

  // Remove restricted fields from the submission for security
  restrictedFields.value.forEach((field) => {
    formData.delete(field)
  })

  const success = await mediaStore.edit(projectId, mediaId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to modify media')
    return
  }

  router.push({ path: `/myprojects/${projectId}/media` })
}

onMounted(() => {
  // Ensure auth store is loaded from localStorage
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()
  }

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
    <!-- Access Control Messages -->
    <div
      v-if="accessMessage"
      :class="[
        'alert',
        accessMessage.type === 'error' ? 'alert-danger' : 'alert-info',
      ]"
      role="alert"
    >
      <i
        :class="
          accessMessage.type === 'error'
            ? 'fa-solid fa-exclamation-triangle'
            : 'fa-solid fa-info-circle'
        "
        class="me-2"
      ></i>
      {{ accessMessage.message }}
    </div>

    <form @submit.prevent="editMedia">
      <div class="row setup-content">
        <div v-for="(definition, index) in schema" :key="index" class="mb-3">
          <label for="index" class="form-label">
            {{ definition.label }}
            <span v-if="isFieldDisabled(index)" class="text-muted ms-1"
              >(read-only)</span
            >
          </label>
          <component
            :key="index"
            :is="definition.view"
            :name="index"
            :value="media[index]"
            :disabled="isFieldDisabled(index)"
            v-bind="definition.args"
          >
          </component>
        </div>
        <div class="btn-form-group">
          <RouterLink :to="{ name: 'MyProjectMediaView' }">
            <button class="btn btn-outline-primary" type="button">
              Cancel
            </button>
          </RouterLink>
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="!canEditMedia"
            :title="
              !canEditMedia
                ? 'You do not have permission to edit this media'
                : ''
            "
          >
            Save
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
