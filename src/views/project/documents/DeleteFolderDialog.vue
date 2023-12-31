<script setup lang="ts">
import { useDocumentsStore } from '@/stores/DocumentsStore'
import DeleteFolderModelComp from '@/components/project/DeleteFolderModelComp.vue'

const props = defineProps<{
  projectId: number | string
  folder: any
}>()

const documentsStore = useDocumentsStore()
async function deleteFolder(folderId: number) {
  const deleted = documentsStore.deleteFolder(props.projectId, folderId)
  if (!deleted) {
    alert('Failed to delete folder')
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
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-bs-dismiss="modal"
            @click="deleteFolder(folder.folder_id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
