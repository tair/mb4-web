<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'
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

const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaStore = useMediaStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)
const formKey = ref(0) // Key to force component re-render

// Computed properties for tracking assignment status
const selectedCount = computed(() => props.selectedMedia.length)

// Count how many selected items have specimen assigned
const specimenAssignedCount = computed(() => {
  return props.selectedMedia.filter(media => 
    media.specimen_id && media.specimen_id !== 0
  ).length
})

// Get the current specimen_id if all selected media have the same specimen
const currentSpecimenId = computed(() => {
  if (props.selectedMedia.length === 0) return undefined
  
  const firstSpecimenId = props.selectedMedia[0]?.specimen_id
  const allSameSpecimen = props.selectedMedia.every(media => media.specimen_id === firstSpecimenId)
  
  return allSameSpecimen ? firstSpecimenId : undefined
})

async function handleSubmitClicked(event: Event) {
  if (isSubmitting.value) return // Prevent double submission
  
  const target = event.currentTarget as any
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)

  // Validate that we have media selected
  const mediaIds = props.selectedMedia.map((m) => {
    return m.media_id || m.id || m.mediaId || m.media_file_id
  }).filter(id => id != null && id !== 0 && id !== '0')
  
  if (!mediaIds || mediaIds.length === 0) {
    showError('No media items selected for specimen assignment')
    return
  }

  isSubmitting.value = true

  try {
    // Assign specimen only
    const assignmentSuccess = await props.batchEdit(json)
    if (!assignmentSuccess) {
      throw new Error('Failed to assign specimen to media files')
    }

    // Close modal BEFORE data refresh to prevent navigation race condition
    const element = document.getElementById('specimenBatchModal')
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
    
    showSuccess(`Successfully assigned specimen to ${mediaIds.length} media items!`)
  } catch (error) {
    console.error('Specimen assignment error:', error)
    // Show specific error message if available, otherwise fall back to generic message
    const errorMessage = error.message || 'Failed to assign specimen to media files'
    showError(errorMessage)
  } finally {
    isSubmitting.value = false
    
    // Ensure modal is closed even if error occurred
    const element = document.getElementById('specimenBatchModal')
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
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }

  // Force component re-render when modal is shown to reflect current selection
  const modalElement = document.getElementById('specimenBatchModal')
  if (modalElement) {
    modalElement.addEventListener('shown.bs.modal', () => {
      // Increment key to force component re-render with fresh props
      formKey.value++
    })
  }
})
</script>
<template>
  <div
    class="modal fade"
    id="specimenBatchModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Assign Specimen to {{ selectedCount }} Media Items
            </h5>
          </div>
          <div class="modal-body">

            <!-- Assignment Status -->
            <div class="alert alert-info">
              <strong>Current Status:</strong>
              <ul class="mb-0 mt-2">
                <li>Specimen assigned: {{ specimenAssignedCount }} / {{ selectedCount }} items</li>
              </ul>
            </div>

            <div class="form-group">
              <label class="form-label">
                <i class="fa fa-bone me-2"></i>
                {{ schema.specimen_id.label }}
              </label>
              <component
                :is="schema.specimen_id.view"
                :value="currentSpecimenId"
                :key="`specimen-${formKey}`"
                name="specimen_id"
              >
              </component>
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
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Assigning Specimen...
              </span>
              <span v-else>
                <i class="fa fa-bone me-2"></i>
                Assign Specimen to {{ selectedCount }} Items
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-label {
  font-weight: bold;
}
</style>

