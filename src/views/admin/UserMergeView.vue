<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useAdminUsersStore } from '@/stores/AdminUsersStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const router = useRouter()
const adminUsersStore = useAdminUsersStore()
const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const isMerging = ref(false)
const showConfirmDialog = ref(false)

// Source user (user to merge FROM - their data will be transferred)
const sourceSearchQuery = ref('')
const sourceSearchResults = ref([])
const isSearchingSource = ref(false)
const selectedSourceUser = ref(null)
const sourceUsage = ref(null)
const isLoadingSourceUsage = ref(false)

// Target user (user to merge INTO - will receive the data)
const targetSearchQuery = ref('')
const targetSearchResults = ref([])
const isSearchingTarget = ref(false)
const selectedTargetUser = ref(null)
const targetUsage = ref(null)
const isLoadingTargetUsage = ref(false)

// Options
const deleteSourceUser = ref(false)

// Debounce timers
let sourceSearchTimer = null
let targetSearchTimer = null

// Search for source users
async function handleSourceSearch() {
  if (sourceSearchTimer) clearTimeout(sourceSearchTimer)
  
  if (sourceSearchQuery.value.length < 2) {
    sourceSearchResults.value = []
    return
  }
  
  sourceSearchTimer = setTimeout(async () => {
    // Capture query at time of request to detect stale responses
    const queryAtRequest = sourceSearchQuery.value
    isSearchingSource.value = true
    try {
      const results = await adminUsersStore.searchUsers(queryAtRequest)
      // Only update results if query hasn't changed during the request
      if (sourceSearchQuery.value === queryAtRequest) {
        // Filter out already selected target user
        sourceSearchResults.value = results.filter(
          u => !selectedTargetUser.value || u.user_id !== selectedTargetUser.value.user_id
        )
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      // Only clear loading state if this is still the current query
      if (sourceSearchQuery.value === queryAtRequest) {
        isSearchingSource.value = false
      }
    }
  }, 300)
}

// Search for target users
async function handleTargetSearch() {
  if (targetSearchTimer) clearTimeout(targetSearchTimer)
  
  if (targetSearchQuery.value.length < 2) {
    targetSearchResults.value = []
    return
  }
  
  targetSearchTimer = setTimeout(async () => {
    // Capture query at time of request to detect stale responses
    const queryAtRequest = targetSearchQuery.value
    isSearchingTarget.value = true
    try {
      const results = await adminUsersStore.searchUsers(queryAtRequest)
      // Only update results if query hasn't changed during the request
      if (targetSearchQuery.value === queryAtRequest) {
        // Filter out already selected source user
        targetSearchResults.value = results.filter(
          u => !selectedSourceUser.value || u.user_id !== selectedSourceUser.value.user_id
        )
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      // Only clear loading state if this is still the current query
      if (targetSearchQuery.value === queryAtRequest) {
        isSearchingTarget.value = false
      }
    }
  }, 300)
}

// Select source user
async function selectSourceUser(user) {
  selectedSourceUser.value = user
  sourceSearchQuery.value = ''
  sourceSearchResults.value = []
  
  // Load usage data
  isLoadingSourceUsage.value = true
  try {
    const usageData = await adminUsersStore.getUserUsage(user.user_id)
    sourceUsage.value = usageData
  } catch (error) {
    console.error('Error loading source user usage:', error)
    showError('Failed to load user data usage')
  } finally {
    isLoadingSourceUsage.value = false
  }
}

// Select target user
async function selectTargetUser(user) {
  selectedTargetUser.value = user
  targetSearchQuery.value = ''
  targetSearchResults.value = []
  
  // Load usage data
  isLoadingTargetUsage.value = true
  try {
    const usageData = await adminUsersStore.getUserUsage(user.user_id)
    targetUsage.value = usageData
  } catch (error) {
    console.error('Error loading target user usage:', error)
    showError('Failed to load user data usage')
  } finally {
    isLoadingTargetUsage.value = false
  }
}

// Clear source user selection
function clearSourceUser() {
  selectedSourceUser.value = null
  sourceUsage.value = null
}

// Clear target user selection
function clearTargetUser() {
  selectedTargetUser.value = null
  targetUsage.value = null
}

// Check if ready to merge
const canMerge = computed(() => {
  return selectedSourceUser.value && 
         selectedTargetUser.value && 
         selectedSourceUser.value.user_id !== selectedTargetUser.value.user_id
})

// Open confirmation dialog
function openConfirmDialog() {
  if (!canMerge.value) {
    showError('Please select both source and target users')
    return
  }
  showConfirmDialog.value = true
}

// Close confirmation dialog
function closeConfirmDialog() {
  showConfirmDialog.value = false
}

// Perform merge
async function performMerge() {
  if (!canMerge.value) return
  
  isMerging.value = true
  try {
    const result = await adminUsersStore.mergeUsers(
      selectedSourceUser.value.user_id,
      selectedTargetUser.value.user_id,
      deleteSourceUser.value
    )
    
    showSuccess(`Successfully merged user data. ${result.totalTransferred} records transferred.`)
    showConfirmDialog.value = false
    
    // Navigate back to users list
    router.push({ name: 'AdminUsersList' })
  } catch (error) {
    showError(error.message || 'Failed to merge users')
  } finally {
    isMerging.value = false
  }
}

// Initialize
onMounted(() => {
  isLoaded.value = true
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
                Merge Users
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-1">Merge Users</h1>
          <p class="text-muted mb-0">
            Transfer all data from one user account to another
          </p>
        </div>
      </div>

      <div class="row">
        <!-- Source User Selection -->
        <div class="col-lg-5">
          <div class="card">
            <div class="card-header bg-warning">
              <h5 class="card-title mb-0">
                <i class="fa fa-user-minus me-2"></i>
                Source User (Merge From)
              </h5>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">
                Select the user whose data will be transferred. After merge, this user's records will belong to the target user.
              </p>

              <!-- Selected Source User -->
              <div v-if="selectedSourceUser" class="selected-user mb-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">{{ selectedSourceUser.name }}</h6>
                    <small class="text-muted">{{ selectedSourceUser.email }}</small>
                    <div>
                      <span :class="['badge', selectedSourceUser.status === 'active' ? 'bg-success' : 'bg-secondary']">
                        {{ selectedSourceUser.status }}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    @click="clearSourceUser"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                </div>

                <!-- Usage Data -->
                <div v-if="isLoadingSourceUsage" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm" role="status"></div>
                  <span class="ms-2">Loading usage data...</span>
                </div>
                <div v-else-if="sourceUsage" class="mt-3">
                  <h6 class="small text-muted">Data to Transfer:</h6>
                  <div v-if="sourceUsage.usage.length === 0" class="text-muted small">
                    No data records found for this user.
                  </div>
                  <ul v-else class="list-unstyled small mb-0 usage-list">
                    <li v-for="item in sourceUsage.usage" :key="item.table" class="d-flex justify-content-between align-items-center py-1">
                      <span>{{ item.description }}</span>
                      <span class="badge badge-orange">{{ item.count }}</span>
                    </li>
                  </ul>
                  <div class="mt-2 pt-2 border-top">
                    <strong>Total Records: {{ sourceUsage.totalRecords }}</strong>
                  </div>
                </div>
              </div>

              <!-- Search Input -->
              <div v-else>
                <div class="input-group mb-2">
                  <span class="input-group-text">
                    <i class="fa fa-search"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search by name or email..."
                    v-model="sourceSearchQuery"
                    @input="handleSourceSearch"
                  />
                </div>

                <!-- Loading -->
                <div v-if="isSearchingSource" class="text-center py-2">
                  <div class="spinner-border spinner-border-sm" role="status"></div>
                </div>

                <!-- Search Results -->
                <div v-else-if="sourceSearchResults.length > 0" class="list-group search-results">
                  <button
                    v-for="user in sourceSearchResults"
                    :key="user.user_id"
                    type="button"
                    class="list-group-item list-group-item-action"
                    @click="selectSourceUser(user)"
                  >
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <div class="fw-bold">{{ user.name }}</div>
                        <small class="text-muted">{{ user.email }}</small>
                      </div>
                      <span :class="['badge', user.status === 'active' ? 'bg-success' : 'bg-secondary']">
                        {{ user.status }}
                      </span>
                    </div>
                  </button>
                </div>

                <div v-else-if="sourceSearchQuery.length >= 2" class="text-muted small">
                  No users found
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="col-lg-2 d-flex align-items-center justify-content-center">
          <div class="merge-arrow text-center py-4">
            <i class="fa fa-arrow-right fa-3x text-primary d-none d-lg-block"></i>
            <i class="fa fa-arrow-down fa-2x text-primary d-lg-none my-3"></i>
            <div class="small text-muted mt-2">Data flows to</div>
          </div>
        </div>

        <!-- Target User Selection -->
        <div class="col-lg-5">
          <div class="card">
            <div class="card-header bg-success text-white">
              <h5 class="card-title mb-0">
                <i class="fa fa-user-plus me-2"></i>
                Target User (Merge Into)
              </h5>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">
                Select the user who will receive all the data. This user will own all transferred records.
              </p>

              <!-- Selected Target User -->
              <div v-if="selectedTargetUser" class="selected-user mb-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">{{ selectedTargetUser.name }}</h6>
                    <small class="text-muted">{{ selectedTargetUser.email }}</small>
                    <div>
                      <span :class="['badge', selectedTargetUser.status === 'active' ? 'bg-success' : 'bg-secondary']">
                        {{ selectedTargetUser.status }}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    @click="clearTargetUser"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                </div>

                <!-- Usage Data -->
                <div v-if="isLoadingTargetUsage" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm" role="status"></div>
                  <span class="ms-2">Loading usage data...</span>
                </div>
                <div v-else-if="targetUsage" class="mt-3">
                  <h6 class="small text-muted">Current Data:</h6>
                  <div v-if="targetUsage.usage.length === 0" class="text-muted small">
                    No data records found for this user.
                  </div>
                  <ul v-else class="list-unstyled small mb-0 usage-list">
                    <li v-for="item in targetUsage.usage" :key="item.table" class="d-flex justify-content-between align-items-center py-1">
                      <span>{{ item.description }}</span>
                      <span class="badge badge-orange">{{ item.count }}</span>
                    </li>
                  </ul>
                  <div class="mt-2 pt-2 border-top">
                    <strong>Total Records: {{ targetUsage.totalRecords }}</strong>
                  </div>
                </div>
              </div>

              <!-- Search Input -->
              <div v-else>
                <div class="input-group mb-2">
                  <span class="input-group-text">
                    <i class="fa fa-search"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search by name or email..."
                    v-model="targetSearchQuery"
                    @input="handleTargetSearch"
                  />
                </div>

                <!-- Loading -->
                <div v-if="isSearchingTarget" class="text-center py-2">
                  <div class="spinner-border spinner-border-sm" role="status"></div>
                </div>

                <!-- Search Results -->
                <div v-else-if="targetSearchResults.length > 0" class="list-group search-results">
                  <button
                    v-for="user in targetSearchResults"
                    :key="user.user_id"
                    type="button"
                    class="list-group-item list-group-item-action"
                    @click="selectTargetUser(user)"
                  >
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <div class="fw-bold">{{ user.name }}</div>
                        <small class="text-muted">{{ user.email }}</small>
                      </div>
                      <span :class="['badge', user.status === 'active' ? 'bg-success' : 'bg-secondary']">
                        {{ user.status }}
                      </span>
                    </div>
                  </button>
                </div>

                <div v-else-if="targetSearchQuery.length >= 2" class="text-muted small">
                  No users found
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Options and Actions -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <div class="form-check">
                    <input
                      id="deleteSourceUser"
                      type="checkbox"
                      class="form-check-input"
                      v-model="deleteSourceUser"
                    />
                    <label for="deleteSourceUser" class="form-check-label">
                      <strong>Delete source user after merge</strong>
                    </label>
                  </div>
                  <small class="text-muted ms-4">
                    If checked, the source user will be soft-deleted (marked as deleted) after the merge is complete.
                  </small>
                </div>
                <div class="col-md-6 text-end">
                  <RouterLink to="/admin/users" class="btn btn-outline-primary me-2">
                    Cancel
                  </RouterLink>
                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="!canMerge"
                    @click="openConfirmDialog"
                  >
                    <i class="fa fa-compress-arrows-alt me-2"></i>
                    Merge Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Panel -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card border-info">
            <div class="card-header bg-info text-white">
              <h5 class="card-title mb-0">
                <i class="fa fa-info-circle me-2"></i>
                How User Merge Works
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <h6><i class="fa fa-database me-2 text-primary"></i>Data Transfer</h6>
                  <p class="small text-muted">
                    All records associated with the source user (projects, media files, taxa, matrices, etc.) 
                    will be updated to reference the target user instead.
                  </p>
                </div>
                <div class="col-md-4">
                  <h6><i class="fa fa-users me-2 text-primary"></i>Memberships</h6>
                  <p class="small text-muted">
                    Project memberships, institution affiliations, and roles will be transferred. 
                    If the target user already has the same membership, duplicates are removed.
                  </p>
                </div>
                <div class="col-md-4">
                  <h6><i class="fa fa-exclamation-triangle me-2 text-warning"></i>Important</h6>
                  <p class="small text-muted">
                    This action is irreversible. The source user's login credentials will remain 
                    but all their data ownership will be transferred to the target user.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click.self="closeConfirmDialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title">
              <i class="fa fa-exclamation-triangle me-2"></i>
              Confirm User Merge
            </h5>
            <button type="button" class="btn-close" @click="closeConfirmDialog"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">
              You are about to merge the following users:
            </p>
            
            <div class="alert alert-light border mb-3">
              <div class="d-flex align-items-center">
                <div class="flex-grow-1">
                  <strong>From:</strong> {{ selectedSourceUser?.name }}
                  <br><small class="text-muted">{{ selectedSourceUser?.email }}</small>
                  <br><small class="text-muted">{{ sourceUsage?.totalRecords || 0 }} records</small>
                </div>
                <i class="fa fa-arrow-right mx-3 text-primary"></i>
                <div class="flex-grow-1">
                  <strong>To:</strong> {{ selectedTargetUser?.name }}
                  <br><small class="text-muted">{{ selectedTargetUser?.email }}</small>
                  <br><small class="text-muted">{{ targetUsage?.totalRecords || 0 }} records</small>
                </div>
              </div>
            </div>

            <div v-if="deleteSourceUser" class="alert alert-warning mb-3">
              <i class="fa fa-trash me-2"></i>
              The source user <strong>{{ selectedSourceUser?.email }}</strong> will be deleted after the merge.
            </div>

            <p class="text-danger mb-0">
              <strong>Warning:</strong> This action cannot be undone!
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="closeConfirmDialog">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-warning"
              :disabled="isMerging"
              @click="performMerge"
            >
              <span v-if="isMerging">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Merging...
              </span>
              <span v-else>
                <i class="fa fa-compress-arrows-alt me-2"></i>
                Confirm Merge
              </span>
            </button>
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

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.selected-user {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
}

.merge-arrow {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-dialog {
  max-width: 500px;
  width: 100%;
  margin: 1rem;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  border-bottom: 1px solid #dee2e6;
  padding: 1rem;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.form-check {
  padding-left: 1.75rem;
}

.form-check-input {
  margin-left: -1.75rem;
}

/* Usage list styling */
.usage-list li {
  border-bottom: 1px solid #f0f0f0;
}

.usage-list li:last-child {
  border-bottom: none;
}

/* Orange theme badge */
.badge-orange {
  background-color: var(--theme-orange, #F17B17);
  color: white;
}
</style>
