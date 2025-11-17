<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import Alert from '@/components/main/Alert.vue'
import { apiService } from '@/services/apiService.js'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useAuthStore } from '@/stores/AuthStore'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id
const isPublishedRoute = computed(() => route.path.startsWith('/project/'))

const projectUsersStore = useProjectUsersStore()
const authStore = useAuthStore()

const isLoaded = ref(false)
const isSubmitted = ref(false)
const selectedUserId = ref(null)
const currentAdmin = ref(null)

// Validation messages
const validationMessages = ref({
  error: '',
  success: '',
})

// Get all project members who are not already admins
const availableMembers = computed(() => {
  if (!projectUsersStore.users) return []
  
  // Return all members including current admin
  return projectUsersStore.users
    .filter(user => user.user_id) // Ensure user has valid ID
    .sort((a, b) => {
      // Sort admins first, then alphabetically
      if (a.admin && !b.admin) return -1
      if (!a.admin && b.admin) return 1
      
      const nameA = `${a.fname || ''} ${a.lname || ''}`.trim()
      const nameB = `${b.fname || ''} ${b.lname || ''}`.trim()
      return nameA.localeCompare(nameB)
    })
})

// Check if current user has permission (curator or admin)
const hasPermission = computed(() => {
  return authStore.isUserCurator || authStore.isUserAdministrator
})

onMounted(async () => {
  try {
    // Load project members
    await projectUsersStore.fetchUsers(projectId)
    
    // Get current project admin from overview or members
    const response = await apiService.get(`/projects/${projectId}/overview`)
    const data = await response.json()
    currentAdmin.value = data.user_id
    
  } catch (error) {
    console.error('Failed to load admin assignment data:', error)
    validationMessages.value.error = 'Failed to load project data. Please try again.'
  } finally {
    isLoaded.value = true
  }
})

async function assignAdmin(event) {
  event.preventDefault()
  
  // Clear previous messages
  validationMessages.value.error = ''
  validationMessages.value.success = ''
  
  if (!selectedUserId.value) {
    validationMessages.value.error = 'Please select a member to assign as project administrator'
    return
  }
  
  if (selectedUserId.value == currentAdmin.value) {
    validationMessages.value.error = 'The selected member is already the project administrator'
    return
  }
  
  try {
    const response = await apiService.put(
      apiService.buildUrl(`/projects/${projectId}/update`),
      { user_id: parseInt(selectedUserId.value) }
    )
    
    if (response.ok) {
      isSubmitted.value = true
      validationMessages.value.success = 'Project administrator has been successfully assigned!'
      
      // Redirect after a short delay
      const redirectPath = isPublishedRoute.value 
        ? `/project/${projectId}/overview`
        : `/myprojects/${projectId}/overview`
      
      setTimeout(() => {
        router.push(redirectPath)
      }, 2000)
    } else {
      const error = await response.json()
      validationMessages.value.error = error.message || 'Failed to assign administrator. Please try again.'
    }
    
  } catch (error) {
    console.error('Failed to assign administrator:', error)
    validationMessages.value.error = 'Failed to assign administrator. Please try again.'
  }
}

function getUserDisplayName(user) {
  const name = `${user.fname || ''} ${user.lname || ''}`.trim()
  return name || `User ${user.user_id}`
}
</script>

<template>
  <ProjectLoaderComp
    v-if="isPublishedRoute"
    :projectId="projectId"
    :isLoading="!isLoaded"
    :errorMessage="null"
    basePath="project"
  >
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Assign Project Administrator</h2>
      <span class="badge bg-secondary">Project P{{ projectId }}</span>
    </div>

    <RouterLink
      :to="`/project/${projectId}/overview`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Project Overview
    </RouterLink>

    <div v-if="!hasPermission" class="alert alert-danger">
      <h5 class="alert-heading">Access Denied</h5>
      <p class="mb-0">
        Only curators and administrators can assign project administrators.
      </p>
    </div>

    <div v-else>
      <p class="mb-4">
        Select a project member to assign as the new project administrator for P{{ projectId }}.
        The new administrator will have full control over the project.
      </p>

      <form @submit="assignAdmin" :class="{ 'disabled': isSubmitted }">
        <div class="row setup-content">
          <!-- Current Admin Info -->
          <div v-if="currentAdmin" class="alert alert-info mb-4">
            <h6 class="alert-heading">Current Project Administrator</h6>
            <p class="mb-0">
              {{ availableMembers.find(u => u.user_id == currentAdmin)?.fname }} 
              {{ availableMembers.find(u => u.user_id == currentAdmin)?.lname }}
              (User ID: {{ currentAdmin }})
            </p>
          </div>

          <!-- Member Selection -->
          <div class="form-group mb-3">
            <label for="member-select" class="form-label fw-bold">
              Select New Administrator <span class="text-danger">*</span>
            </label>
            <select
              id="member-select"
              v-model="selectedUserId"
              class="form-select"
              required
              :disabled="isSubmitted"
            >
              <option :value="null" disabled>Choose a project member...</option>
              <option
                v-for="member in availableMembers"
                :key="member.user_id"
                :value="member.user_id"
              >
                {{ getUserDisplayName(member) }}
                {{ member.admin ? ' (Current Admin)' : '' }}
                (ID: {{ member.user_id }})
              </option>
            </select>
            <div class="form-text">
              Select a member from the list above to assign as the new project administrator.
            </div>
          </div>

          <!-- Information Notice -->
          <div class="alert alert-warning">
            <h6 class="alert-heading"><i class="fa fa-exclamation-triangle"></i> Important Notice</h6>
            <ul class="mb-0">
              <li>The new administrator will have full control over the project.</li>
              <li>The current administrator will remain a project member but will lose administrator privileges.</li>
              <li>This action requires curator or administrator permissions.</li>
            </ul>
          </div>

          <!-- Alert for validation messages -->
          <Alert
            :message="validationMessages"
            messageName="error"
            alertType="danger"
          />
          
          <!-- Success message -->
          <Alert
            :message="validationMessages"
            messageName="success"
            alertType="success"
          />

          <!-- Submit buttons -->
          <div class="btn-form-group">
            <RouterLink :to="`/project/${projectId}/overview`">
              <button class="btn btn-outline-primary" type="button">
                Cancel
              </button>
            </RouterLink>
            <button class="btn btn-primary" type="submit" :disabled="isSubmitted">
              {{ isSubmitted ? 'Administrator Assigned' : 'Assign Administrator' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </ProjectLoaderComp>

  <LoadingIndicator v-else :isLoaded="isLoaded">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Assign Project Administrator</h2>
      <span class="badge bg-secondary">Project P{{ projectId }}</span>
    </div>

    <RouterLink
      :to="`/myprojects/${projectId}/overview`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Project Overview
    </RouterLink>

    <div v-if="!hasPermission" class="alert alert-danger">
      <h5 class="alert-heading">Access Denied</h5>
      <p class="mb-0">
        Only curators and administrators can assign project administrators.
      </p>
    </div>

    <div v-else>
      <p class="mb-4">
        Select a project member to assign as the new project administrator for P{{ projectId }}.
        The new administrator will have full control over the project.
      </p>

      <form @submit="assignAdmin" :class="{ 'disabled': isSubmitted }">
        <div class="row setup-content">
          <!-- Current Admin Info -->
          <div v-if="currentAdmin" class="alert alert-info mb-4">
            <h6 class="alert-heading">Current Project Administrator</h6>
            <p class="mb-0">
              {{ availableMembers.find(u => u.user_id == currentAdmin)?.fname }} 
              {{ availableMembers.find(u => u.user_id == currentAdmin)?.lname }}
              (User ID: {{ currentAdmin }})
            </p>
          </div>

          <!-- Member Selection -->
          <div class="form-group mb-3">
            <label for="member-select-unpub" class="form-label fw-bold">
              Select New Administrator <span class="text-danger">*</span>
            </label>
            <select
              id="member-select-unpub"
              v-model="selectedUserId"
              class="form-select"
              required
              :disabled="isSubmitted"
            >
              <option :value="null" disabled>Choose a project member...</option>
              <option
                v-for="member in availableMembers"
                :key="member.user_id"
                :value="member.user_id"
              >
                {{ getUserDisplayName(member) }}
                {{ member.admin ? ' (Current Admin)' : '' }}
                (ID: {{ member.user_id }})
              </option>
            </select>
            <div class="form-text">
              Select a member from the list above to assign as the new project administrator.
            </div>
          </div>

          <!-- Information Notice -->
          <div class="alert alert-warning">
            <h6 class="alert-heading"><i class="fa fa-exclamation-triangle"></i> Important Notice</h6>
            <ul class="mb-0">
              <li>The new administrator will have full control over the project.</li>
              <li>The current administrator will remain a project member but will lose administrator privileges.</li>
              <li>This action requires curator or administrator permissions.</li>
            </ul>
          </div>

          <!-- Alert for validation messages -->
          <Alert
            :message="validationMessages"
            messageName="error"
            alertType="danger"
          />
          
          <!-- Success message -->
          <Alert
            :message="validationMessages"
            messageName="success"
            alertType="success"
          />

          <!-- Submit buttons -->
          <div class="btn-form-group">
            <RouterLink :to="`/myprojects/${projectId}/overview`">
              <button class="btn btn-outline-primary" type="button">
                Cancel
              </button>
            </RouterLink>
            <button class="btn btn-primary" type="submit" :disabled="isSubmitted">
              {{ isSubmitted ? 'Administrator Assigned' : 'Assign Administrator' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';

.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.disabled .form-control:disabled,
.disabled .form-select:disabled {
  opacity: 0.8;
}

.alert-heading {
  font-weight: 600;
  margin-bottom: 0.5rem;
}
</style>

