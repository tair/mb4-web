<script setup>
import { ref, onMounted, computed } from 'vue'
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
    
    if (selectedStatus.value === 1 && request.value.status !== 1) {
      // Approving
      result = await store.approveRequest(requestId.value, editedName.value)
      if (result.success) {
        showSuccess('Institution approved successfully! It is now visible to all users.')
      }
    } else if (selectedStatus.value === 2 && request.value.status !== 2) {
      // Rejecting
      result = await store.rejectRequest(requestId.value)
      if (result.success) {
        showSuccess('Institution request rejected. It will remain visible only to the creator.')
      }
    } else {
      // Just updating the name or no status change
      result = await store.approveRequest(requestId.value, editedName.value)
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
      if (result.error?.includes('References exist')) {
        showError('Cannot delete: This institution is in use by users or projects. Please remap references first.')
      } else {
        showError(result.error || 'Failed to delete request')
      }
    }
  } catch (error) {
    console.error('Error deleting request:', error)
    showError('Failed to delete request')
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
                    :disabled="request.status === 1"
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
</style>

