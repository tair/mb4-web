<script setup lang="ts">
import { computed } from 'vue'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useAuthStore } from '@/stores/AuthStore'

const props = defineProps<{
  projectId: number | string
  user?: any
}>()
const projectUsersStore = useProjectUsersStore()
const authStore = useAuthStore()

// Check if current user is project admin
const isCurrentUserProjectAdmin = computed(() => {
  const currentUserId = authStore.user?.userId
  if (!currentUserId) return false
  
  const userMembership = projectUsersStore.getUserById(currentUserId)
  return userMembership?.admin === true
})

async function deleteUser(userId: number) {
  // Check if current user is project admin before allowing deletion
  if (!isCurrentUserProjectAdmin.value) {
    alert('Only project administrators can delete members')
    return
  }
  
  const deleted = await projectUsersStore.deleteUser(props.projectId, userId)
  if (!deleted) {
    alert('Failed to delete user')
  }
}
</script>
<template>
  <div class="modal" id="userDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body">
          Really delete member: <i>{{ `${user.fname} ${user.lname}` }}</i> ?
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
            @click="deleteUser(user.user_id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
