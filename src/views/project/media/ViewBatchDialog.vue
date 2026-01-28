<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  batchEdit: (formData: any) => Promise<boolean>
  selectedMedia: any[]
}>()

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const mediaStore = useMediaStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)
const formKey = ref(0) // Key to force component re-render

// Computed properties for tracking assignment status
const selectedCount = computed(() => props.selectedMedia.length)

// Count how many selected items have view assigned  
const viewAssignedCount = computed(() => {
  return props.selectedMedia.filter(media => 
    media.view_id && media.view_id !== 0
  ).length
})

// Get the current view_id if all selected media have the same view
const currentViewId = computed(() => {
  if (props.selectedMedia.length === 0) return undefined
  
  const firstViewId = props.selectedMedia[0]?.view_id
  const allSameView = props.selectedMedia.every(media => media.view_id === firstViewId)
  
  return allSameView ? firstViewId : undefined
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
    showError('No media items selected for view assignment')
    return
  }

  isSubmitting.value = true

  try {
    // Assign view only
    const assignmentSuccess = await props.batchEdit(json)
    if (!assignmentSuccess) {
      throw new Error('Failed to assign view to media files')
    }

    // Close modal BEFORE data refresh to prevent navigation race condition
    const element = document.getElementById('viewBatchModal')
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
    
    showSuccess(`Successfully assigned view to ${mediaIds.length} media items!`)
  } catch (error) {
    console.error('View assignment error:', error)
    // Show specific error message if available, otherwise fall back to generic message
    const errorMessage = error.message || 'Failed to assign view to media files'
    showError(errorMessage)
  } finally {
    isSubmitting.value = false
    
    // Ensure modal is closed even if error occurred
    const element = document.getElementById('viewBatchModal')
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

  // Force component re-render when modal is shown to reflect current selection
  const modalElement = document.getElementById('viewBatchModal')
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
    id="viewBatchModal"
    data-bs-backdrop="static"
    data-bs-keyboard="true"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Assign View to {{ selectedCount }} Media Items
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">

            <!-- Assignment Status -->
            <div class="alert alert-info">
              <strong>Current Status:</strong>
              <ul class="mb-0 mt-2">
                <li>View assigned: {{ viewAssignedCount }} / {{ selectedCount }} items</li>
              </ul>
            </div>

            <div class="form-group">
              <label class="form-label">
                <i class="fa fa-eye me-2"></i>
                {{ schema.view_id.label }}
              </label>
              <component
                :is="schema.view_id.view"
                :value="currentViewId"
                :key="`view-${formKey}`"
                name="view_id"
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
                Assigning View...
              </span>
              <span v-else>
                <i class="fa fa-eye me-2"></i>
                Assign View to {{ selectedCount }} Items
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

