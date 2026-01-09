<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useAdminUsersStore } from '@/stores/AdminUsersStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const router = useRouter()
const adminUsersStore = useAdminUsersStore()
const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const isSaving = ref(false)

// Form data
const form = ref({
  email: '',
  fname: '',
  lname: '',
  active: false,
})

// Role management
const selectedRoleIds = ref([])

// Institution management
const userInstitutions = ref([])
const institutionSearchQuery = ref('')
const institutionSearchResults = ref([])
const isSearchingInstitutions = ref(false)

// Computed
const roles = computed(() => adminUsersStore.roles)

// Validation
const emailError = ref('')

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function handleEmailInput() {
  if (form.value.email && !validateEmail(form.value.email)) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = ''
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
  }
  institutionSearchQuery.value = ''
  institutionSearchResults.value = []
}

// Remove institution
function removeInstitution(institutionId) {
  userInstitutions.value = userInstitutions.value.filter(i => i.institution_id !== institutionId)
}

// Create user
async function handleCreate() {
  // Validate form
  if (!form.value.email || !form.value.fname || !form.value.lname) {
    showError('Email, first name, and last name are required')
    return
  }

  if (!validateEmail(form.value.email)) {
    showError('Please enter a valid email address')
    return
  }

  isSaving.value = true
  try {
    const userData = {
      email: form.value.email,
      fname: form.value.fname,
      lname: form.value.lname,
      active: form.value.active,
      roleIds: selectedRoleIds.value,
      institutionIds: userInstitutions.value.map(i => i.institution_id),
    }

    await adminUsersStore.createUser(userData)
    showSuccess('User created successfully')
    router.push({ name: 'AdminUsersList' })
  } catch (error) {
    showError(error.message || 'Failed to create user')
  } finally {
    isSaving.value = false
  }
}

// Initialize
onMounted(async () => {
  try {
    await adminUsersStore.fetchRoles()
  } catch (error) {
    console.error('Error loading roles:', error)
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
                Create New User
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-1">Create New User</h1>
          <p class="text-muted mb-0">
            Add a new user to the system
          </p>
        </div>
      </div>

      <div class="row">
        <!-- Main Form -->
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">User Details</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleCreate">
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
                    :class="['form-control', { 'is-invalid': emailError }]"
                    v-model="form.email"
                    @input="handleEmailInput"
                    required
                  />
                  <div v-if="emailError" class="invalid-feedback">
                    {{ emailError }}
                  </div>
                  <small class="text-muted">
                    This will be used as the user's login identifier.
                  </small>
                </div>

                <div class="mb-4">
                  <div class="form-check">
                    <input
                      id="activeCheck"
                      type="checkbox"
                      class="form-check-input"
                      v-model="form.active"
                    />
                    <label for="activeCheck" class="form-check-label">
                      <strong>Activate account immediately</strong>
                    </label>
                  </div>
                  <small class="text-muted ms-4">
                    If checked, the user will be able to log in immediately. Otherwise, they will need to be activated manually.
                  </small>
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
                      No institutions selected
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
                <div class="d-flex justify-content-end">
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
                      Creating...
                    </span>
                    <span v-else>
                      <i class="fa fa-plus me-2"></i>
                      Create User
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Sidebar Info -->
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-info-circle me-2"></i>
                Information
              </h5>
            </div>
            <div class="card-body">
              <p class="mb-3">
                <strong>Note:</strong> The user will not have a password set. They will need to use the "Forgot Password" feature to set their password before they can log in.
              </p>
              <p class="mb-3">
                If you activate the account immediately, the user will receive an activation email with instructions.
              </p>
              <p class="mb-0">
                <strong>Required fields</strong> are marked with an asterisk (*).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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

