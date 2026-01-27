<script setup lang="ts">
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  projectId: number | string
  group?: any
}>()
const projectMemberGroupsStore = useProjectMemberGroupsStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
async function deleteGroup(groupId: number) {
  const deleted = await projectMemberGroupsStore.deleteGroup(
    props.projectId,
    groupId
  )
  if (!deleted) {
    showError('Failed to delete group', 'Delete Failed')
  }
}
</script>
<template>
  <div class="modal" id="groupDeleteModal" data-bs-keyboard="true" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          Really delete group: <i>{{ group.group_name }}</i> ?
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
            type="button"
            class="btn btn-primary"
            data-bs-dismiss="modal"
            @click="deleteGroup(group.group_id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
