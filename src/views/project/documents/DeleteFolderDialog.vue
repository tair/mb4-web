<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import DeleteFolderModelComp from '@/components/project/DeleteFolderModelComp.vue'
import type { S3Warning } from '@/types/documents'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  projectId: number | string
  folder: any
}>()

const documentsStore = useDocumentsStore()
const { showError, showWarning } = useNotifications()

const isDeleting = ref(false)

async function deleteFolder(folderId: number) {
  if (isDeleting.value) return // Prevent double-clicking
  
  isDeleting.value = true
  
  try {
    const result = await documentsStore.deleteFolder(props.projectId, folderId)
    
    if (result.success) {
      // Refresh the list to show updated data
      await documentsStore.refreshDocuments(props.projectId)
      
      // Show warnings if there were S3 cleanup issues
      if ('warnings' in result && result.warnings) {
        const warnings = result.warnings as S3Warning
        showWarning('Folder deleted successfully', warnings.message)
      }
    } else {
      showError(('error' in result ? result.error : null) || 'Failed to delete folder')
    }
  } catch (error) {
    console.error('Error deleting folder:', error)
    showError('Failed to delete folder. Please try again.')
  } finally {
    isDeleting.value = false
  }
}
</script>
<template>
  <div class="modal" id="folderDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body" v-if="folder">
          Really delete folder: <i>{{ folder?.title }}</i> ?
          <DeleteFolderModelComp
            :documents="documentsStore.getDocumentsForFolder(folder?.folder_id)"
          >
          </DeleteFolderModelComp>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-primary"
            data-bs-dismiss="modal"
            :disabled="isDeleting"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :data-bs-dismiss="isDeleting ? '' : 'modal'"
            :disabled="isDeleting"
            @click="deleteFolder(folder.folder_id)"
          >
            <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
