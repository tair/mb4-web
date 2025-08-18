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
import { useProjectsStore } from '@/stores/ProjectsStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
import { editSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { buildMediaUrl } from '@/utils/fileUtils.js'

const route = useRoute()
const projectId = parseInt(route.params.id)
const mediaId = parseInt(route.params.mediaId)

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const validationErrors = ref([])
const isSubmitting = ref(false)
const thumbnailError = ref(false)

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)
const media = computed(() => mediaStore.getMediaById(mediaId))

// Computed property for media thumbnail URL
const thumbnailUrl = computed(() => {
  if (!media.value || isSubmitting.value || thumbnailError.value) return null
  
  // Check if this is a 3D file
  if (media.value.media_type === '3d' || media.value.thumbnail?.USE_ICON === '3d') {
    return '/images/3DImage.png'
  }
  
  // For videos and images, try to get thumbnail, fallback to large or original
  return buildMediaUrl(projectId, mediaId, 'thumbnail') || 
         buildMediaUrl(projectId, mediaId, 'large') || 
         buildMediaUrl(projectId, mediaId, 'original')
})

// Handle thumbnail loading errors
function handleThumbnailError() {
  thumbnailError.value = true
}

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

// Reset thumbnail error when media changes (e.g., after successful update)
watch(
  media,
  () => {
    if (media.value) {
      thumbnailError.value = false
    }
  }
)

// Helper function to check if a field should be disabled
function isFieldDisabled(field) {
  // Disable all fields if user can't edit the media
  if (!canEditMedia.value) return true

  // Disable restricted fields
  if (restrictedFields.value.includes(field)) return true

  return false
}

// Validation function for required fields and conditional copyright validation
function validateFormData(formData) {
  const errors = []
  
  // Conditional validation for copyright fields
  const copyrightCheckbox = formData.get('is_copyrighted')
  const isCopyrighted = copyrightCheckbox === '1' || copyrightCheckbox === 1
  
  if (isCopyrighted) {
    // Check copyright_permission - must not be the default "not set" option (value 0)
    const copyrightPermission = formData.get('copyright_permission')
    const copyrightPermissionValue = parseInt(String(copyrightPermission), 10)
    
    if (isNaN(copyrightPermissionValue) || copyrightPermissionValue === 0) {
      errors.push('Copyright permission must be selected when media is under copyright (cannot use "Copyright permission not set")')
    }
    
    // Check copyright_license - must not be the default "not set" option (value 0)
    const copyrightLicense = formData.get('copyright_license')
    const copyrightLicenseValue = parseInt(String(copyrightLicense), 10)
    
    if (isNaN(copyrightLicenseValue) || copyrightLicenseValue === 0) {
      errors.push('Media reuse license must be selected when media is under copyright (cannot use "Media reuse policy not set")')
    }
  }
  
  return errors
}

async function editMedia(event) {
  // Prevent submission if user doesn't have access
  if (!canEditMedia.value) {
    alert('You do not have permission to edit this media.')
    return
  }

  const formData = new FormData(event.currentTarget)
  
  // Validate form data
  const errors = validateFormData(formData)
  if (errors.length > 0) {
    validationErrors.value = errors
    return
  }
  
  // Check if this should be set as project exemplar
  const exemplarValue = formData.get('is_exemplar')
  const isExemplar = exemplarValue === 'on' || exemplarValue === '1' || exemplarValue === 1 || exemplarValue === true
  
  // Remove the is_exemplar field from formData as the backend doesn't expect it
  formData.delete('is_exemplar')
  
  // Clear any previous validation errors and errors
  validationErrors.value = []
  thumbnailError.value = false
  isSubmitting.value = true

  try {
    // Remove restricted fields from the submission for security
    restrictedFields.value.forEach((field) => {
      formData.delete(field)
    })

    const success = await mediaStore.edit(projectId, mediaId, formData)
    if (!success) {
      alert('Failed to modify media')
      return
    }

    // If the media was edited successfully and should be set as exemplar
    if (isExemplar) {
      try {
        // Set this media as the project exemplar
        const exemplarSuccess = await projectsStore.setExemplarMedia(projectId, mediaId)
        if (!exemplarSuccess) {
          alert('Media updated successfully, but failed to set as project exemplar')
        }
      } catch (error) {
        console.error('Failed to set exemplar media:', error)
        alert('Media updated successfully, but failed to set as project exemplar')
      }
    }

    window.location.href = `/myprojects/${projectId}/media`
  } catch (error) {
    console.error('Error editing media:', error)
    alert('Failed to modify media')
  } finally {
    isSubmitting.value = false
  }
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

    <!-- Current Media Thumbnail -->
    <div v-if="media" class="mb-4">
      <h5>Current Media</h5>
      <div class="thumbnail-container">
        <!-- Loading state during submission -->
        <div v-if="isSubmitting" class="d-flex align-items-center justify-content-center border rounded" style="width: 200px; height: 150px; background-color: #f8f9fa;">
          <div class="text-center">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
              <span class="visually-hidden">Processing...</span>
            </div>
            <div class="text-muted small">Processing media...</div>
          </div>
        </div>
        
        <!-- Thumbnail display when not submitting -->
        <template v-else-if="thumbnailUrl && !thumbnailError">
          <img 
            :src="thumbnailUrl" 
            :alt="`Media ${mediaId} thumbnail`"
            class="img-thumbnail"
            style="max-width: 200px; max-height: 200px; object-fit: contain;"
            @error="handleThumbnailError"
          />
        </template>
        
        <!-- Error state or no thumbnail -->
        <div v-else class="d-flex align-items-center justify-content-center border rounded" style="width: 200px; height: 150px; background-color: #f8f9fa;">
          <div class="text-center text-muted">
            <i class="fa-solid fa-image fs-1 mb-2 opacity-50"></i>
            <div class="small">
              {{ thumbnailError ? 'Image temporarily unavailable' : 'No preview available' }}
            </div>
          </div>
        </div>
        
        <div class="mt-2 text-muted small">
          Media ID: M{{ mediaId }}
        </div>
      </div>
    </div>

    <form @submit.prevent="editMedia">
      <div class="row setup-content">        
        <div v-for="(definition, index) in editSchema" :key="index" class="mb-3">
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
        
        <!-- Display validation errors -->
        <div v-if="validationErrors.length > 0" class="alert alert-danger" role="alert">
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
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
            :disabled="!canEditMedia || isSubmitting"
            :title="
              !canEditMedia
                ? 'You do not have permission to edit this media'
                : isSubmitting
                ? 'Processing...'
                : ''
            "
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isSubmitting ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped>
.form-label {
  font-weight: bold;
}
</style>
