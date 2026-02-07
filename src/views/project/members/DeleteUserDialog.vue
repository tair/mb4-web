<script setup lang="ts">
import { computed } from 'vue'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  projectId: number | string
  user?: any
}>()
const projectUsersStore = useProjectUsersStore()
const authStore = useAuthStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()

// Check if current user is project admin or system curator or administrator
const isCurrentUserProjectAdmin = computed(() => {
  // System curators and administrators have full access
  if (authStore.isUserCurator || authStore.isUserAdministrator) return true
  
  const currentUserId = authStore.user?.userId
  if (!currentUserId) return false
  
  const userMembership = projectUsersStore.getUserById(currentUserId)
  return userMembership?.admin === true
})

async function deleteUser(userId: number) {
  // Check if current user is project admin, curator, or administrator before allowing deletion
  if (!isCurrentUserProjectAdmin.value) {
    showWarning('Only project administrators, curators, and administrators can delete members', 'Access Denied')
    return
  }
  
  const deleted = await projectUsersStore.deleteUser(props.projectId, userId)
  if (!deleted) {
    showError('Failed to delete user', 'Delete Failed')
  }
}
</script>
<template>
  <div class="modal" id="userDeleteModal" data-bs-keyboard="true" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
