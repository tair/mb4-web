<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useNotifications } from '@/composables/useNotifications'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { userSchema } from '@/views/project/members/schema.js'

const route = useRoute()
const projectId = route.params.id
const userId = parseInt(route.params.userId)

const projectUsersStore = useProjectUsersStore()
const authStore = useAuthStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const user = computed(() => projectUsersStore.getUserById(userId))

// Check if current user is project admin or system curator or administrator
const isCurrentUserProjectAdmin = computed(() => {
  // System curators and administrators have full access
  if (authStore.isUserCurator || authStore.isUserAdministrator) return true
  
  const currentUserId = authStore.user?.userId
  if (!currentUserId) return false
  
  const userMembership = projectUsersStore.getUserById(currentUserId)
  return userMembership?.admin === true
})

async function edit(event) {
  // Check if current user is project admin, curator, or administrator before allowing edit
  if (!isCurrentUserProjectAdmin.value) {
    showWarning('Only project administrators, curators, and administrators can edit member permissions', 'Access Denied')
    return
  }
  
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  json.group_ids = formData.getAll('group_ids')

  const success = await projectUsersStore.editUser(
    projectId,
    userId,
    json.membership_type,
    json.group_ids
  )
  if (success) {
    router.go(-1)
  } else {
    showError('Failed to update member', 'Update Failed')
  }
}

onMounted(() => {
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="projectUsersStore.isLoaded">
    <div>
      <div v-if="user" class="d-flex">
        <p class="fw-bold">Editing:&nbsp;</p>
        {{ `${user.fname} ${user.lname}` }}
      </div>
      
      <div v-if="!isCurrentUserProjectAdmin" class="alert alert-warning">
        <h5>Access Denied</h5>
        <p>Only project administrators, curators, and administrators can edit member permissions.</p>
        <button
          class="btn btn-primary"
          type="button"
          @click="$router.go(-1)"
        >
          Go Back
        </button>
      </div>
      
      <form v-else @submit.prevent="edit">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in userSchema"
            :key="index"
            class="form-group mb-3"
          >
            <label :for="index" class="form-label fw-bold">{{
              definition.label
            }}</label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              :value="user[index]"
              v-bind="definition.args"
            >
            </component>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-outline-primary me-2"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>
