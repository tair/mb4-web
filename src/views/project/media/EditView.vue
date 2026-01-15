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
import { useNotifications } from '@/composables/useNotifications'
import { NavigationPatterns } from '@/utils/navigationUtils.js'
import { editSchema } from '@/views/project/media/schema.js'
import { apiService } from '@/services/apiService.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaDetailsCompCompact from '@/components/project/MediaDetailsCompCompact.vue'
import CopyrightFormFields from '@/components/project/CopyrightFormFields.vue'

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
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)
const copyrightFormRef = ref(null)


const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded &&
    projectsStore.isLoaded
)
const media = computed(() => mediaStore.getMediaById(mediaId))

// Check if media has citations/bibliographic references (placeholder until citations store is loaded)
const hasCitations = ref(false)

// Computed schema that excludes copyright fields (handled by CopyrightFormFields component)
const filteredEditSchema = computed(() => {
  const schema = { ...editSchema }
  // Remove copyright fields - they're handled by CopyrightFormFields component
  delete schema.is_copyrighted
  delete schema.copyright_permission
  delete schema.copyright_license
  delete schema.copyright_info
  return schema
})

// Get current project to check if it's published
const project = computed(() => projectsStore.getProjectById(projectId))
const isProjectPublished = computed(() => {
  // Only return the published status if projects are loaded
  if (!projectsStore.isLoaded) return false
  return project.value?.published === 1
})

// Format media data for MediaDetailsComp
const mediaFileForDetails = computed(() => {
  if (!media.value) return null

  return {
    media: media.value,
    media_id: mediaId,
    // Add other fields that MediaDetailsComp might need
    project_id: projectId,
    // These might come from related stores, but for now we'll use empty defaults
    taxon_name: '',
    specimen_name: '',
    specimen_notes: '',
    view_name: '',
    side_represented: '',
    user_name: '',
    copyright_holder: '',
    copyright_permission: '',
    references: [],
    notes: '',
    url: '',
    url_description: '',
    created_on: media.value?.created_on,
    ancestor: null,
    hits: media.value?.hits || 0,
    downloads: media.value?.downloads || 0,
    license: null
  }
})



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

// Handle bulk copyright apply completion
function handleBulkApplied(event) {
  showSuccess(`Copyright settings applied to ${event.count} media files`)
  // Optionally refresh the media store to reflect changes
  mediaStore.fetchMedia(projectId)
}

// Validation function for required fields and conditional copyright validation
function validateFormData(formData) {
  const errors = []
  
  // Validate copyright fields using the component's validation
  if (copyrightFormRef.value) {
    const copyrightErrors = copyrightFormRef.value.validate()
    errors.push(...copyrightErrors)
  }
  
  return errors
}

async function editMedia(event) {
  // Prevent submission if user doesn't have access
  if (!canEditMedia.value) {
    showError('You do not have permission to edit this media.')
    return
  }

  const formData = new FormData(event.currentTarget)
  
  // FIX: Explicitly set is_copyrighted to 0 if checkbox is unchecked
  if (!formData.has('is_copyrighted')) {
    formData.set('is_copyrighted', '0')
  }
  
  // Validate form data
  const errors = validateFormData(formData)
  if (errors.length > 0) {
    showError(errors.join('; '), 'Validation Error')
    return
  }
  
  // Check if this should be set as project exemplar
  const exemplarValue = formData.get('is_exemplar')
  const isExemplar = exemplarValue === 'on' || exemplarValue === '1' || exemplarValue === 1 || exemplarValue === true
  
  // Remove the is_exemplar field from formData as the backend doesn't expect it
  formData.delete('is_exemplar')
  
  isSubmitting.value = true

  try {
    // Remove restricted fields from the submission for security
    restrictedFields.value.forEach((field) => {
      formData.delete(field)
    })

    const success = await mediaStore.edit(projectId, mediaId, formData)
    if (!success) {
      showError('Failed to modify media')
      return
    }

    // If the media was edited successfully and should be set as exemplar
    if (isExemplar) {
      try {
        // Set this media as the project exemplar
        const exemplarSuccess = await projectsStore.setExemplarMedia(projectId, mediaId)
        if (!exemplarSuccess) {
          showError('Media updated successfully, but failed to set as project exemplar', 'Warning')
        }
      } catch (error) {
        console.error('Failed to set exemplar media:', error)
        showError('Media updated successfully, but failed to set as project exemplar', 'Warning')
      }
    }

    showSuccess('Media updated successfully!')
    // Navigate back to media list, preserving any filter query params from the referrer
    const referrerQuery = route.query || {}
    await router.push({ 
      path: `/myprojects/${projectId}/media`,
      query: referrerQuery
    })
  } catch (error) {
    console.error('Error editing media:', error)
    showError('Failed to modify media', 'Update Failed')
  } finally {
    isSubmitting.value = false
  }
}



// Load citations count for bulk apply feature
async function loadCitationsStatus() {
  try {
    const response = await apiService.get(
      `/projects/${projectId}/media/${mediaId}/citations`
    )
    const data = await response.json()
    hasCitations.value = data.citations && data.citations.length > 0
  } catch (error) {
    console.error('Error loading citations status:', error)
    hasCitations.value = false
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
  if (!projectsStore.isLoaded) {
    projectsStore.fetchProjects()
  }
  
  // Load citations status for bulk apply feature
  loadCitationsStatus()
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

    <!-- Media Details Component -->
    <div v-if="mediaFileForDetails" class="mb-4">
      <h5 class="mb-3">Current Media</h5>
      <MediaDetailsCompCompact
        :media_file="mediaFileForDetails"
        :project_id="projectId"
        :can-edit="canEditMedia"
        :is-project-published="false"
        :use-annotation-link-id="false"
      />
    </div>


    <form @submit.prevent="editMedia">
      <div class="row setup-content">
        <!-- Non-copyright fields from schema -->
        <div v-for="(definition, index) in filteredEditSchema" :key="index" class="mb-3">
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
        
        <!-- Copyright Fields Component -->
        <div class="mb-3">
          <CopyrightFormFields
            ref="copyrightFormRef"
            :initial-is-copyrighted="media?.is_copyrighted"
            :initial-copyright-permission="media?.copyright_permission || 0"
            :initial-copyright-license="media?.copyright_license || 0"
            :initial-copyright-info="media?.copyright_info || ''"
            :media-id="mediaId"
            :disabled="!canEditMedia"
            :show-bulk-apply="true"
            :specimen-id="media?.specimen_id"
            :has-citations="hasCitations"
            @bulk-applied="handleBulkApplied"
          />
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

/* Annotation Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content-large {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 95%;
  max-height: 95%;
  overflow: hidden;
  z-index: 1001;
}

.annotation-modal-close {
  position: absolute;
  top: -10px;
  right: -10px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #ccc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  z-index: 1100;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.annotation-modal-close:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #999;
  color: #333;
  transform: scale(1.1);
}

/* Thumbnail click cursor */
.thumbnail-container img[style*="cursor: pointer"] {
  transition: opacity 0.2s ease;
}

.thumbnail-container img[style*="cursor: pointer"]:hover {
  opacity: 0.8;
}
</style>
