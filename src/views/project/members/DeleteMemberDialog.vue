<script setup lang="ts">
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'

const props = defineProps<{
  projectId: number | string
  member?: any
}>()
const membersStore = useProjectUsersStore()
async function deleteMember(linkId: number) {
  const deleted = membersStore.deleteMember(props.projectId, linkId)
  if (!deleted) {
    alert('Failed to delete member')
  }
}
</script>
<template>
  <div class="modal" id="memberDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body">
          Really delete member: <i>{{ `${member.fname} ${member.lname}` }}</i> ?
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
            @click="deleteMember(member.link_id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
