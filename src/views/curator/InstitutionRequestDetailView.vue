<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useInstitutionRequestsStore } from '@/stores/InstitutionRequestsStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const route = useRoute()
const router = useRouter()
const store = useInstitutionRequestsStore()
const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const isSaving = ref(false)
const editedName = ref('')
const selectedStatus = ref(0)

// Remap dialog state
const showRemapDialog = ref(false)
const remapUsageCount = ref(null)
const remapSearchQuery = ref('')
const remapSearchResults = ref([])
const remapSearching = ref(false)
const selectedRemapTarget = ref(null)
const isDeleting = ref(false)

const requestId = computed(() => parseInt(route.params.requestId))

const request = computed(() => store.currentRequest)

const canChangeStatus = computed(() => {
  // Can't change from approved to rejected
  if (request.value?.status === 1) {
    return false
  }
  return true
})

const statusOptions = [
  { value: 0, label: 'New (Pending)' },
  { value: 1, label: 'Approved' },
  { value: 2, label: 'Rejected' }
]

const availableStatusOptions = computed(() => {
  if (request.value?.status === 1) {
    // Already approved - can't change
    return statusOptions.filter(s => s.value === 1)
  }
  return statusOptions
})

onMounted(async () => {
  try {
    await store.fetchRequest(requestId.value)
    if (request.value) {
      editedName.value = request.value.institution?.name || ''
      selectedStatus.value = request.value.status
    }
  } catch (error) {
    console.error('Error loading request:', error)
    showError('Failed to load institution request')
  } finally {
    isLoaded.value = true
  }
})

async function saveChanges() {
  isSaving.value = true
  
  try {
    let result
    const statusChanging = selectedStatus.value !== request.value.status
    const nameChanged = editedName.value.trim() !== request.value.institution?.name
    
    if (selectedStatus.value === 1 && request.value.status !== 1) {
      // Approving (status changing to approved)
      result = await store.approveRequest(requestId.value, editedName.value)
      if (result.success) {
        showSuccess('Institution approved successfully! It is now visible to all users.')
      }
    } else if (selectedStatus.value === 2 && request.value.status !== 2) {
      // Rejecting (status changing to rejected)
      result = await store.rejectRequest(requestId.value)
      if (result.success) {
        showSuccess('Institution request rejected. It will remain visible only to the creator.')
      }
    } else {
      // No status change - use updateRequest to only update the name
      result = await store.updateRequest(requestId.value, { 
        institutionName: editedName.value,
        status: selectedStatus.value
      })
      if (result.success) {
        showSuccess('Changes saved successfully')
      }
    }
    
    if (result.success) {
      // Refresh the request
      await store.fetchRequest(requestId.value)
      editedName.value = store.currentRequest?.institution?.name || ''
      selectedStatus.value = store.currentRequest?.status || 0
    } else {
      showError(result.error || 'Failed to save changes')
    }
  } catch (error) {
    console.error('Error saving changes:', error)
    showError('Failed to save changes')
  } finally {
    isSaving.value = false
  }
}

async function deleteRequest() {
  if (!confirm('Are you sure you want to delete this request? The institution will be deleted as well.')) {
    return
  }
  
  try {
    const result = await store.deleteRequest(requestId.value, { deleteInstitution: true })
    if (result.success) {
      showSuccess('Request and institution deleted successfully')
      router.push('/curator/institution-requests')
    } else {
      if (result.error?.includes('references') || result.error?.includes('References exist')) {
        // Show remap dialog
        remapUsageCount.value = result.usageCount || { users: 0, projects: 0, total: 0 }
        showRemapDialog.value = true
      } else {
        showError(result.error || 'Failed to delete request')
      }
    }
  } catch (error) {
    console.error('Error deleting request:', error)
    showError('Failed to delete request')
  }
}

// Search for institutions to remap to
let searchTimeout = null
watch(remapSearchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (!newQuery || newQuery.length < 2) {
    remapSearchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    remapSearching.value = true
    const institutionId = request.value?.institution?.institution_id
    const result = await store.searchInstitutions(newQuery, institutionId)
    remapSearchResults.value = result.institutions || []
    remapSearching.value = false
  }, 300)
})

function selectRemapTarget(institution) {
  selectedRemapTarget.value = institution
  remapSearchQuery.value = institution.name
  remapSearchResults.value = []
}

function closeRemapDialog() {
  showRemapDialog.value = false
  remapUsageCount.value = null
  remapSearchQuery.value = ''
  remapSearchResults.value = []
  selectedRemapTarget.value = null
}

async function confirmRemapAndDelete() {
  if (!selectedRemapTarget.value) {
    showError('Please select an institution to remap references to')
    return
  }
  
  isDeleting.value = true
  
  try {
    const result = await store.deleteRequest(requestId.value, { 
      deleteInstitution: true, 
      remapToId: selectedRemapTarget.value.institution_id 
    })
    
    if (result.success) {
      showSuccess('References remapped and institution deleted successfully')
      closeRemapDialog()
      router.push('/curator/institution-requests')
    } else {
      showError(result.error || 'Failed to delete institution')
    }
  } catch (error) {
    console.error('Error deleting with remap:', error)
    showError('Failed to delete institution')
  } finally {
    isDeleting.value = false
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 0:
      return 'bg-warning text-dark'
    case 1:
      return 'bg-success'
    case 2:
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="mb-0">
          Institution Request #{{ requestId }}
        </h1>
        <RouterLink to="/curator/institution-requests" class="btn btn-outline-secondary">
          <i class="fa fa-arrow-left"></i>
          Back to Requests
        </RouterLink>
      </div>

      <div v-if="!request" class="alert alert-warning">
        Request not found
      </div>

      <div v-else class="row">
        <!-- Main Content -->
        <div class="col-md-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Institution Details</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveChanges">
                <div class="mb-3">
                  <label class="form-label"><strong>Institution Name</strong></label>
                  <input 
                    type="text" 
                    v-model="editedName" 
                    class="form-control"
                    maxlength="100"
                  >
                  <small class="text-muted">Max 100 characters</small>
                </div>

                <div class="mb-3">
                  <label class="form-label"><strong>Status</strong></label>
                  <select 
                    v-model="selectedStatus" 
                    class="form-select"
                    :disabled="!canChangeStatus"
                  >
                    <option 
                      v-for="option in availableStatusOptions" 
                      :key="option.value" 
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <small v-if="request.status === 1" class="text-muted">
                    Once approved, an institution cannot be changed to rejected.
                  </small>
                </div>

                <div class="alert alert-info mb-3" v-if="request.status === 0">
                  <strong>Pending Review:</strong> 
                  By approving this institution, it will become visible to all users throughout the site. 
                  By rejecting it, the institution will still exist but will only be visible to the user who created it.
                </div>

                <div class="d-flex gap-2">
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    :disabled="isSaving"
                  >
                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-danger"
                    @click="deleteRequest"
                    :disabled="isSaving"
                  >
                    Delete
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-md-4">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Request Info</h5>
            </div>
            <div class="card-body">
              <dl>
                <dt>Current Status</dt>
                <dd>
                  <span class="badge" :class="getStatusBadgeClass(request.status)">
                    {{ request.statusLabel }}
                  </span>
                </dd>

                <dt>Institution ID</dt>
                <dd>{{ request.institution?.institution_id || 'N/A' }}</dd>

                <dt>Created On</dt>
                <dd>{{ new Date(request.createdOnFormatted).toLocaleString() }}</dd>

                <dt v-if="request.completedOnFormatted">Completed On</dt>
                <dd v-if="request.completedOnFormatted">
                  {{ new Date(request.completedOnFormatted).toLocaleString() }}
                </dd>
              </dl>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Requester</h5>
            </div>
            <div class="card-body">
              <dl>
                <dt>Name</dt>
                <dd>{{ request.User?.fname }} {{ request.User?.lname }}</dd>

                <dt>Email</dt>
                <dd>
                  <a :href="`mailto:${request.User?.email}`">
                    {{ request.User?.email }}
                  </a>
                </dd>

                <dt>User ID</dt>
                <dd>{{ request.user_id }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Remap Dialog Modal -->
    <div v-if="showRemapDialog" class="modal-backdrop fade show"></div>
    <div v-if="showRemapDialog" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Remap Institution References</h5>
            <button type="button" class="btn-close" @click="closeRemapDialog" :disabled="isDeleting"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>This institution has references that must be remapped before deletion:</strong>
              <ul class="mb-0 mt-2">
                <li v-if="remapUsageCount?.users > 0">{{ remapUsageCount.users }} user(s) affiliated</li>
                <li v-if="remapUsageCount?.projects > 0">{{ remapUsageCount.projects }} project(s) affiliated</li>
              </ul>
            </div>
            
            <div class="mb-3">
              <label class="form-label"><strong>Select institution to remap references to:</strong></label>
              <input 
                type="text" 
                v-model="remapSearchQuery" 
                class="form-control"
                placeholder="Search for an institution..."
                :disabled="isDeleting"
              >
              
              <!-- Search results dropdown -->
              <div v-if="remapSearchResults.length > 0" class="list-group mt-1 remap-search-results">
                <button 
                  v-for="inst in remapSearchResults" 
                  :key="inst.institution_id"
                  type="button"
                  class="list-group-item list-group-item-action"
                  @click="selectRemapTarget(inst)"
                >
                  {{ inst.name }}
                </button>
              </div>
              
              <div v-if="remapSearching" class="text-muted mt-1">
                <span class="spinner-border spinner-border-sm me-1"></span>
                Searching...
              </div>
              
              <div v-if="selectedRemapTarget" class="mt-2">
                <span class="badge bg-success">
                  Selected: {{ selectedRemapTarget.name }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeRemapDialog" :disabled="isDeleting">
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmRemapAndDelete"
              :disabled="!selectedRemapTarget || isDeleting"
            >
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1"></span>
              Remap & Delete
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

.card-header {
  background-color: #f8f9fa;
}

dl {
  margin-bottom: 0;
}

dt {
  font-weight: 600;
  color: #495057;
  margin-top: 0.5rem;
}

dt:first-child {
  margin-top: 0;
}

dd {
  margin-bottom: 0.5rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.remap-search-results {
  position: absolute;
  z-index: 1060;
  max-height: 200px;
  overflow-y: auto;
  width: calc(100% - 2rem);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
</style>

