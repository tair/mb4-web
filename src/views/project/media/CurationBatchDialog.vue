<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  batchEdit: (formData: any) => Promise<boolean>
  selectedMedia: any[]
}>()

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaStore = useMediaStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)

const menuCollapsed = ref({
  mediaEditView: false, // Start expanded for curation
  mediaEditSpecimen: false, // Start expanded for curation
})

// Validation state
const validationErrors = ref<string[]>([])

// Function to validate form data
function validateForm(formData: any) {
  validationErrors.value = []

  if (
    !formData.specimen_id ||
    formData.specimen_id === '0' ||
    formData.specimen_id === 0
  ) {
    validationErrors.value.push('Specimen must be assigned to release media')
  }

  if (!formData.view_id || formData.view_id === '0' || formData.view_id === 0) {
    validationErrors.value.push('View must be assigned to release media')
  }
}

// Computed properties for tracking assignment status
const selectedCount = computed(() => props.selectedMedia.length)

// Count how many selected items have specimen assigned
const specimenAssignedCount = computed(() => {
  return props.selectedMedia.filter(media => 
    media.specimen_id && media.specimen_id !== 0
  ).length
})

// Count how many selected items have view assigned  
const viewAssignedCount = computed(() => {
  return props.selectedMedia.filter(media => 
    media.view_id && media.view_id !== 0
  ).length
})

// Count how many selected items are ready for release (have both specimen and view)
const readyForReleaseCount = computed(() => {
  return props.selectedMedia.filter(media => 
    media.specimen_id && media.specimen_id !== 0 &&
    media.view_id && media.view_id !== 0
  ).length
})

// Computed properties for validation
const canRelease = computed(() => {
  return validationErrors.value.length === 0
})

// Get the current specimen_id if all selected media have the same specimen
const currentSpecimenId = computed(() => {
  if (props.selectedMedia.length === 0) return undefined
  
  const firstSpecimenId = props.selectedMedia[0]?.specimen_id
  const allSameSpecimen = props.selectedMedia.every(media => media.specimen_id === firstSpecimenId)
  
  return allSameSpecimen ? firstSpecimenId : undefined
})

// Get the current view_id if all selected media have the same view
const currentViewId = computed(() => {
  if (props.selectedMedia.length === 0) return undefined
  
  const firstViewId = props.selectedMedia[0]?.view_id
  const allSameView = props.selectedMedia.every(media => media.view_id === firstViewId)
  
  return allSameView ? firstViewId : undefined
})

const specimenOptions = computed(() => {
  const options: Record<string, number> = { '- NONE - ': 0 }
  for (const specimen of specimensStore.specimens) {
    const taxon = taxaStore.getTaxonById(specimen.taxon_id)
    const specimenName = `${specimen.specimen_id} - ${
      taxon ? taxon.scientific_name : 'Unknown Taxon'
    }`
    options[specimenName] = specimen.specimen_id
  }
  return options
})

const viewOptions = computed(() => {
  const options: Record<string, number> = { '- NONE - ': 0 }
  for (const mediaView of mediaViewsStore.mediaViews) {
    options[mediaView.name] = mediaView.view_id
  }
  return options
})

async function handleSubmitClicked(event: Event) {
  if (isSubmitting.value) return // Prevent double submission
  
  const target = event.currentTarget as any
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)

  // Validate form data
  validateForm(json)

  if (validationErrors.value.length > 0) {
    showError(validationErrors.value.join('; '), 'Validation Error')
    return // Don't submit if validation fails
  }

  // Capture media IDs BEFORE any API calls to avoid losing selection after refresh
  const mediaIds = props.selectedMedia.map((m) => {
    // Try different possible ID property names
    return m.media_id || m.id || m.mediaId || m.media_file_id
  }).filter(id => id != null && id !== 0 && id !== '0') // Filter out null, undefined, 0, or '0' values
  
  // Validate that we have media IDs
  if (!mediaIds || mediaIds.length === 0) {
    showError('No media items selected for assignment and release')
    return
  }

  isSubmitting.value = true

  try {
    // First, assign specimen and view (without cataloguing_status)
    const assignmentSuccess = await props.batchEdit(json)
    if (!assignmentSuccess) {
      throw new Error('Failed to assign specimen and view to media files')
    }

    // Second, release the media by setting cataloguing_status to 0
    const releaseSuccess = await mediaStore.editIds(projectId, mediaIds, {
      cataloguing_status: 0,
    })

    if (!releaseSuccess) {
      throw new Error('Assignment successful, but failed to release media files')
    }

    // Close modal BEFORE data refresh to prevent navigation race condition
    const element = document.getElementById('curationBatchModal')
    if (element) {
      const modal = Modal.getInstance(element)
      if (modal) {
        modal.hide()
      } else {
        // Fallback: create new modal instance and hide it
        const newModal = new Modal(element)
        newModal.hide()
      }
    }
    
    // Force immediate cleanup
    const backdrop = document.querySelector('.modal-backdrop')
    if (backdrop) {
      backdrop.remove()
    }
    document.body.classList.remove('modal-open')
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-right')

    // Small delay to ensure modal cleanup completes before data refresh
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear the store to ensure fresh data
    mediaStore.invalidate()
    // Refresh the media list to show updated status
    await mediaStore.fetchMedia(projectId)
    
    showSuccess(`Successfully assigned and released ${mediaIds.length} media items!`)
  } catch (error) {
    console.error('Curation error:', error)
    // Show specific error message if available, otherwise fall back to generic message
    const errorMessage = error.message || 'Failed to assign and release media files'
    showError(errorMessage)
  } finally {
    isSubmitting.value = false
    
    // Ensure modal is closed even if error occurred
    const element = document.getElementById('curationBatchModal')
    if (element) {
      const modal = Modal.getInstance(element)
      if (modal) {
        modal.hide()
      }
      
      // Final cleanup
      setTimeout(() => {
        const backdrop = document.querySelector('.modal-backdrop')
        if (backdrop) {
          backdrop.remove()
        }
        document.body.classList.remove('modal-open')
        document.body.style.removeProperty('overflow')
        document.body.style.removeProperty('padding-right')
      }, 50)
    }
  }
}

onMounted(() => {
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }

  const values = menuCollapsed.value as any
  for (const id of Object.keys(values)) {
    const element = document.getElementById(id)
    if (element) {
      const listener = () => {
        values[id] = !element.classList.contains('show')
      }

      element.addEventListener('shown.bs.collapse', listener)
      element.addEventListener('hidden.bs.collapse', listener)
    }
  }

  // Add event listeners to clear validation errors when form values change
  nextTick(() => {
    const form = document.querySelector('#curationBatchModal form')
    if (form) {
      form.addEventListener('change', () => {
        validationErrors.value = []
      })
      form.addEventListener('input', () => {
        validationErrors.value = []
      })
    }
  })
})
</script>
<template>
  <div
    class="modal fade"
    id="curationBatchModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Assign and Release {{ selectedCount }} Media Items
            </h5>
          </div>
          <div class="modal-body">

            <!-- Assignment Status -->
            <div class="alert alert-info">
              <strong>Assignment Status:</strong>
              <ul class="mb-0 mt-2">
                <li>Specimen assigned: {{ specimenAssignedCount }} / {{ selectedCount }} items</li>
                <li>View assigned: {{ viewAssignedCount }} / {{ selectedCount }} items</li>
                <li>
                  Ready to release: {{ readyForReleaseCount }} / {{ selectedCount }} items
                </li>
              </ul>
            </div>

            <div class="accordion" id="accordionCurationBatchModal">
              <!-- View Assignment -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mediaEditView"
                    aria-expanded="true"
                    aria-controls="mediaEditView"
                  >
                    <i class="fa fa-eye me-2"></i>
                    View Assignment (Required for Release)
                  </button>
                </h2>
                <div
                  id="mediaEditView"
                  class="accordion-collapse collapse show"
                >
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.view_id.label }}
                      </label>
                      <component
                        :is="schema.view_id.view"
                        :disabled="menuCollapsed['mediaEditView']"
                        :value="currentViewId"
                        name="view_id"
                      >
                      </component>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Specimen Assignment -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mediaEditSpecimen"
                    aria-expanded="true"
                    aria-controls="mediaEditSpecimen"
                  >
                    <i class="fa fa-bone me-2"></i>
                    Specimen Assignment (Required for Release)
                  </button>
                </h2>
                <div
                  id="mediaEditSpecimen"
                  class="accordion-collapse collapse show"
                >
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.specimen_id.label }}
                      </label>
                      <component
                        :is="schema.specimen_id.view"
                        :disabled="menuCollapsed['mediaEditSpecimen']"
                        :value="currentSpecimenId"
                        name="specimen_id"
                      >
                      </component>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-primary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-success"
              :disabled="!canRelease || isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Assigning and Releasing...
              </span>
              <span v-else>
                <i class="fa fa-arrow-up-from-bracket me-2"></i>
                Assign and Release {{ selectedCount }} Media Items
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.accordion-button:not(.collapsed) {
  background-color: #e7f3ff;
  color: #0c63e4;
}

.accordion-button:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-label {
  font-weight: bold;
}
</style>
