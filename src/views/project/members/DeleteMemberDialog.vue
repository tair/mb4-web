<script setup lang="ts">
import { useDocumentsStore } from '@/stores/DocumentsStore'

const props = defineProps<{
  projectId: number | string
  document?: any
}>()

const documentsStore = useDocumentsStore()
async function deleteDocument(documentId: number) {
  const deleted = documentsStore.deleteDocuments(props.projectId, [documentId])
  if (deleted) {
    documentsStore.removeDocumentById([documentId])
  } else {
    alert('Failed to delete document')
  }
}
</script>
<template>
  <div class="modal" id="documentDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body">
          Really delete document: <i>{{ document.title }}</i> ?
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-bs-dismiss="modal"
            @click="deleteDocument(document.document_id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>