<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useAuthStore } from '@/stores/AuthStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MembersComp from '@/components/project/MembersComp.vue'
import DeleteUserDialog from '@/views/project/members/DeleteUserDialog.vue'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const authStore = useAuthStore()
const numOfUsers = computed(() => projectUsersStore.users?.length)
const userToDelete = ref({})

// Check if current user is project admin or system curator or administrator
const isCurrentUserProjectAdmin = computed(() => {
  if (authStore.isUserCurator || authStore.isUserAdministrator) return true
  
  const currentUserId = authStore.user?.userId
  if (!currentUserId) return false
  
  const userMembership = projectUsersStore.getUserById(currentUserId)
  return userMembership?.admin === true
})

const currentUserMembership = computed(() => {
  const userId = authStore.user?.userId
  return userId ? projectUsersStore.getUserById(userId) : null
})

const orcidOptOut = computed({
  get: () => !!currentUserMembership.value?.orcid_publish_opt_out,
  set: (value) => {
    projectUsersStore.updateOrcidOptOut(projectId, value)
  },
})
const users = computed(() =>
  projectUsersStore.users.sort((a, b) => {
    const nameA = a.fname
    const adminA = a.admin
    const adminB = b.admin
    if (adminA || adminB) {
      return adminA ? -1 : 1
    }
    if (!nameA) {
      return -1
    }

    const nameB = b.fname
    if (!nameB) {
      return -1
    }

    const compare = nameA.localeCompare(nameB)
    if (compare) {
      return compare
    }
  })
)

onMounted(() => {
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="projectUsersStore.isLoaded">
    <header v-if="numOfUsers == 1">
      There is {{ numOfUsers }} member associated with this project.
    </header>
    <header v-else>
      There are {{ numOfUsers }} members associated with this project.
    </header>
    <br />
    <div class="action-bar" v-if="isCurrentUserProjectAdmin">
      <RouterLink :to="`/myprojects/${projectId}/members/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Add New Member </span>
        </button>
      </RouterLink>
    </div>
    <div v-if="currentUserMembership" class="card mt-3 mb-3">
      <div class="card-body">
        <label class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="orcidOptOut"
          />
          <span class="form-check-label">
            Opt out of ORCID publishing for this project
          </span>
        </label>
        <div class="text-muted small mt-1">
          When checked, your published works from this project will not be pushed to your ORCID record.
        </div>
      </div>
    </div>
    <MembersComp
      :users="users"
      :projectId="projectId"
      v-model:deleteUser="userToDelete"
    ></MembersComp>
  </LoadingIndicator>
  <DeleteUserDialog :user="userToDelete" :projectId="projectId" />
</template>
