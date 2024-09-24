<script setup lang="ts">
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'

const props = defineProps<{
  projectId: number | string
  group?: any
}>()
const projectMemberGroupsStore = useProjectMemberGroupsStore()
async function deleteGroup(groupId: number) {
  const deleted = await projectMemberGroupsStore.deleteGroup(
    props.projectId,
    groupId
  )
  if (!deleted) {
    alert('Failed to delete group')
  }
}
</script>
<template>
  <div class="modal" id="groupDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body">
          Really delete group: <i>{{ group.group_name }}</i> ?
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
            @click="deleteGroup(group.group_id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
