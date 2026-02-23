<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useAdminUsersStore } from '@/stores/AdminUsersStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import UserDeleteDialog from './UserDeleteDialog.vue'

const router = useRouter()
const route = useRoute()
const adminUsersStore = useAdminUsersStore()
const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const isSaving = ref(false)
const showDeleteDialog = ref(false)

// Form data
const form = ref({
  email: '',
  fname: '',
  lname: '',
  userclass: 0,
})

// Role management
const selectedRoleIds = ref([])
const rolesChanged = ref(false)

// Institution management
const userInstitutions = ref([])
const institutionSearchQuery = ref('')
const institutionSearchResults = ref([])
const isSearchingInstitutions = ref(false)
const institutionsChanged = ref(false)

// Computed
const userId = computed(() => parseInt(route.params.userId))
const user = computed(() => adminUsersStore.currentUser)
const roles = computed(() => adminUsersStore.roles)
const isUserActive = computed(() => user.value?.active === true)

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

// Initialize form with user data
function initializeForm() {
  if (user.value) {
    form.value = {
      email: user.value.email || '',
      fname: user.value.fname || '',
      lname: user.value.lname || '',
      userclass: user.value.userclass || 0,
    }
    selectedRoleIds.value = user.value.roles?.map(r => r.role_id) || []
    userInstitutions.value = user.value.institutions || []
    rolesChanged.value = false
    institutionsChanged.value = false
  }
}

// Handle role checkbox change
function handleRoleChange(roleId, checked) {
  if (checked) {
    if (!selectedRoleIds.value.includes(roleId)) {
      selectedRoleIds.value.push(roleId)
    }
  } else {
    selectedRoleIds.value = selectedRoleIds.value.filter(id => id !== roleId)
  }
  rolesChanged.value = true
}

// Search institutions
let searchTimeout = null
async function handleInstitutionSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (institutionSearchQuery.value.length < 2) {
    institutionSearchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    isSearchingInstitutions.value = true
    try {
      const results = await adminUsersStore.searchInstitutions(institutionSearchQuery.value)
      // Filter out already added institutions
      const existingIds = userInstitutions.value.map(i => i.institution_id)
      institutionSearchResults.value = results.filter(i => !existingIds.includes(i.institution_id))
    } catch (error) {
      console.error('Error searching institutions:', error)
    } finally {
      isSearchingInstitutions.value = false
    }
  }, 300)
}

// Add institution
function addInstitution(institution) {
  if (!userInstitutions.value.find(i => i.institution_id === institution.institution_id)) {
    userInstitutions.value.push({
      institution_id: institution.institution_id,
      name: institution.name,
    })
    institutionsChanged.value = true
  }
  institutionSearchQuery.value = ''
  institutionSearchResults.value = []
}

// Remove institution
function removeInstitution(institutionId) {
  userInstitutions.value = userInstitutions.value.filter(i => i.institution_id !== institutionId)
  institutionsChanged.value = true
}

// Save user
async function handleSave() {
  if (!form.value.email || !form.value.fname || !form.value.lname) {
    showError('Email, first name, and last name are required')
    return
  }

  isSaving.value = true
  
  // Capture the current change states before any updates
  // (updateUser refetches, which triggers initializeForm and resets these flags)
  const shouldUpdateRoles = rolesChanged.value
  const shouldUpdateInstitutions = institutionsChanged.value
  const currentRoleIds = [...selectedRoleIds.value]
  const currentInstitutionIds = userInstitutions.value.map(i => i.institution_id)
  
  try {
    // Update user details
    await adminUsersStore.updateUser(userId.value, {
      email: form.value.email,
      fname: form.value.fname,
      lname: form.value.lname,
      userclass: form.value.userclass,
    })

    // Update roles if changed
    if (shouldUpdateRoles) {
      await adminUsersStore.updateUserRoles(userId.value, currentRoleIds)
    }

    // Update institutions if changed
    if (shouldUpdateInstitutions) {
      await adminUsersStore.updateUserInstitutions(userId.value, currentInstitutionIds)
    }

    showSuccess('User updated successfully')
    router.push({ name: 'AdminUsersList' })
  } catch (error) {
    showError(error.message || 'Failed to update user')
  } finally {
    isSaving.value = false
  }
}

// Activate user
async function handleActivate() {
  try {
    await adminUsersStore.activateUser(userId.value, true)
    showSuccess('User has been activated and an email has been sent')
  } catch (error) {
    showError(error.message || 'Failed to activate user')
  }
}

// Deactivate user
async function handleDeactivate() {
  try {
    await adminUsersStore.deactivateUser(userId.value)
    showSuccess('User has been deactivated')
  } catch (error) {
    showError(error.message || 'Failed to deactivate user')
  }
}

// Delete user
function handleDeleteClick() {
  showDeleteDialog.value = true
}

async function confirmDelete() {
  try {
    await adminUsersStore.deleteUser(userId.value)
    showSuccess('User has been deleted')
    showDeleteDialog.value = false
    router.push({ name: 'AdminUsersList' })
  } catch (error) {
    showError(error.message || 'Failed to delete user')
  }
}

function cancelDelete() {
  showDeleteDialog.value = false
}

// Watch for user data changes
watch(user, () => {
  initializeForm()
})

// Initialize
onMounted(async () => {
  try {
    await Promise.all([
      adminUsersStore.fetchUser(userId.value),
      adminUsersStore.fetchRoles(),
    ])
    initializeForm()
  } catch (error) {
    showError('Failed to load user data')
  } finally {
    isLoaded.value = true
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <div class="row mb-3">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item">
                <RouterLink to="/admin">Admin</RouterLink>
              </li>
              <li class="breadcrumb-item">
                <RouterLink to="/admin/users">User Logins</RouterLink>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                Edit User
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-1">Edit User</h1>
          <p class="text-muted mb-0" v-if="user">
            {{ user.email }}
          </p>
        </div>
      </div>

      <div class="row">
        <!-- Main Form -->
        <div class="col-lg-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">User Details</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleSave">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="fname" class="form-label">First Name *</label>
                    <input
                      id="fname"
                      type="text"
                      class="form-control"
                      v-model="form.fname"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label for="lname" class="form-label">Last Name *</label>
                    <input
                      id="lname"
                      type="text"
                      class="form-control"
                      v-model="form.lname"
                      required
                    />
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    class="form-control"
                    v-model="form.email"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="userclass" class="form-label">User Class</label>
                  <select id="userclass" class="form-select" v-model="form.userclass">
                    <option :value="0">Full Access</option>
                    <option :value="255">Deleted</option>
                  </select>
                </div>

                <!-- Roles -->
                <div class="mb-3">
                  <label class="form-label">Roles</label>
                  <div class="border rounded p-3 bg-light">
                    <div v-if="roles.length === 0" class="text-muted">
                      No roles available
                    </div>
                    <div
                      v-for="role in roles"
                      :key="role.role_id"
                      class="form-check"
                    >
                      <input
                        :id="`role-${role.role_id}`"
                        type="checkbox"
                        class="form-check-input"
                        :checked="selectedRoleIds.includes(role.role_id)"
                        @change="handleRoleChange(role.role_id, $event.target.checked)"
                      />
                      <label :for="`role-${role.role_id}`" class="form-check-label">
                        <strong>{{ role.name }}</strong>
                        <span v-if="role.description" class="text-muted ms-2">
                          - {{ role.description }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Institutions -->
                <div class="mb-4">
                  <label class="form-label">Institutions</label>
                  
                  <!-- Search -->
                  <div class="input-group mb-2">
                    <span class="input-group-text">
                      <i class="fa fa-search"></i>
                    </span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Search institutions to add..."
                      v-model="institutionSearchQuery"
                      @input="handleInstitutionSearch"
                    />
                  </div>

                  <!-- Search Results -->
                  <div
                    v-if="institutionSearchResults.length > 0"
                    class="list-group mb-2 institution-results"
                  >
                    <button
                      v-for="inst in institutionSearchResults"
                      :key="inst.institution_id"
                      type="button"
                      class="list-group-item list-group-item-action"
                      @click="addInstitution(inst)"
                    >
                      <i class="fa fa-plus me-2 text-success"></i>
                      {{ inst.name }}
                    </button>
                  </div>

                  <!-- Current Institutions -->
                  <div class="border rounded p-3 bg-light">
                    <div v-if="userInstitutions.length === 0" class="text-muted">
                      No institutions associated
                    </div>
                    <div
                      v-for="inst in userInstitutions"
                      :key="inst.institution_id"
                      class="d-flex justify-content-between align-items-center mb-2"
                    >
                      <span>{{ inst.name }}</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="removeInstitution(inst.institution_id)"
                      >
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="d-flex justify-content-between">
                  <button
                    type="button"
                    class="btn btn-danger"
                    @click="handleDeleteClick"
                    :disabled="isSaving"
                  >
                    <i class="fa fa-trash me-2"></i>
                    Delete User
                  </button>
                  <div>
                    <RouterLink
                      to="/admin/users"
                      class="btn btn-outline-primary me-2"
                    >
                      Cancel
                    </RouterLink>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="isSaving"
                    >
                      <span v-if="isSaving">
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </span>
                      <span v-else>
                        <i class="fa fa-save me-2"></i>
                        Save Changes
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Status Card -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">Account Status</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Status:</strong>
                <span
                  :class="[
                    'badge ms-2',
                    isUserActive ? 'bg-success' : 'bg-warning text-dark'
                  ]"
                >
                  {{ user?.status || 'Unknown' }}
                </span>
              </div>

              <div class="d-grid gap-2">
                <button
                  v-if="!isUserActive && user?.status !== 'deleted'"
                  type="button"
                  class="btn btn-success"
                  @click="handleActivate"
                >
                  <i class="fa fa-check me-2"></i>
                  Activate User
                </button>
                <button
                  v-if="isUserActive"
                  type="button"
                  class="btn btn-warning"
                  @click="handleDeactivate"
                >
                  <i class="fa fa-ban me-2"></i>
                  Deactivate User
                </button>
              </div>

              <hr />

              <div class="small text-muted">
                <div v-if="user?.approvedOn" class="mb-2">
                  <strong>Approved:</strong> {{ formatDate(user.approvedOn) }}
                </div>
                <div v-if="user?.lastLoginAt" class="mb-2">
                  <strong>Last Login:</strong> {{ formatDate(user.lastLoginAt) }}
                </div>
                <div class="mb-2">
                  <strong>Terms Accepted:</strong>
                  {{ user?.acceptedTerms ? 'Yes' : 'No' }}
                </div>
                <div class="mb-2">
                  <strong>Profile Updated:</strong>
                  {{ user?.hasUpdatedProfile ? 'Yes' : 'No' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Advisor Info Card (if student) -->
          <div v-if="user?.advisor" class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">Student Advisor</h5>
            </div>
            <div class="card-body">
              <div class="mb-2">
                <strong>Name:</strong> {{ user.advisor.name }}
              </div>
              <div v-if="user.advisor.email">
                <strong>Email:</strong>
                <a :href="`mailto:${user.advisor.email}`">{{ user.advisor.email }}</a>
              </div>
            </div>
          </div>

          <!-- Additional Info Card -->
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">Additional Info</h5>
            </div>
            <div class="card-body small">
              <div v-if="user?.registrationCountry" class="mb-2">
                <strong>Country:</strong> {{ user.registrationCountry }}
              </div>
              <div v-if="user?.orcid" class="mb-2">
                <strong>ORCID:</strong>
                <a
                  :href="`https://orcid.org/${user.orcid}`"
                  target="_blank"
                  rel="noopener"
                >
                  {{ user.orcid }}
                </a>
                <span v-if="user.orcidWriteAccess" class="badge bg-success ms-1">Read &amp; Write</span>
                <span v-else class="badge bg-secondary ms-1">Read Only</span>
              </div>
              <div v-if="user?.lastConfirmedProfileOn" class="mb-2">
                <strong>Profile Confirmed:</strong>
                {{ formatDate(user.lastConfirmedProfileOn) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <UserDeleteDialog
      :show="showDeleteDialog"
      :user="user"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </LoadingIndicator>
</template>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin-bottom: 0;
}

.institution-results {
  max-height: 200px;
  overflow-y: auto;
}

.form-check {
  padding-left: 1.75rem;
}

.form-check-input {
  margin-left: -1.75rem;
}
</style>

