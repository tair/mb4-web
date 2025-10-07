<script setup lang="ts">
import { Modal } from 'bootstrap'
import { useMediaStore } from '@/stores/MediaStore'
import { useNotifications } from '@/composables/useNotifications'
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const props = defineProps<{
  mediaToDelete: any[]
}>()

const route = useRoute()
const projectId = route.params.id
const mediaStore = useMediaStore()
const { showError, showSuccess } = useNotifications()
const isDeleting = ref(false)

async function handleDeleteButtonClicked() {
  if (isDeleting.value) return // Prevent double clicks
  
  isDeleting.value = true
  try {
    const mediaIds = props.mediaToDelete.map((media) => media.media_id)

    const success = await mediaStore.deleteIds(projectId, mediaIds)

    if (success) {
      showSuccess(`Successfully deleted ${props.mediaToDelete.length} media items!`)
      const element = document.getElementById('mediaDeleteModal')
      const modal = Modal.getInstance(element)
      modal.hide()
    } else {
      showError('Failed to delete media')
    }
  } catch (error) {
    console.error('Error deleting media:', error)
    showError('Failed to delete media')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div
    class="modal fade"
    id="mediaDeleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-exclamation-triangle text-warning me-2"></i>
            Confirm Media Deletion
          </h5>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete
            <strong>{{ mediaToDelete.length }}</strong>
            media item{{ mediaToDelete.length !== 1 ? 's' : '' }}?
          </p>

          <div v-if="mediaToDelete.length > 0" class="alert alert-warning">
            <strong>Warning:</strong> This action cannot be undone. The
            following media will be permanently deleted:
            <ul class="mt-2 mb-0">
              <li v-for="media in mediaToDelete" :key="media.media_id">
                Media ID: {{ media.media_id }}
                <span v-if="media.specimen_id"
                  >(Specimen: {{ media.specimen_id }})</span
                >
                <span v-if="media.view_id">(View: {{ media.view_id }})</span>
              </li>
            </ul>
          </div>

          <p class="text-muted small">
            This will remove the media from the project and delete associated
            files from storage.
          </p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-secondary"
            data-bs-dismiss="modal"
            :disabled="isDeleting"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="handleDeleteButtonClicked"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting">
              <i class="fa fa-spinner fa-spin me-2"></i>
              Deleting {{ mediaToDelete.length }} Media Item{{
                mediaToDelete.length !== 1 ? 's' : ''
              }}...
            </span>
            <span v-else>
              <i class="fa fa-trash-can me-2"></i>
              Delete {{ mediaToDelete.length }} Media Item{{
                mediaToDelete.length !== 1 ? 's' : ''
              }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-header .fa-exclamation-triangle {
  color: #ffc107;
}
</style>
