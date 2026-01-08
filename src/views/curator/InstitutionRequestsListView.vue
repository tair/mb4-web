<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useInstitutionRequestsStore } from '@/stores/InstitutionRequestsStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const store = useInstitutionRequestsStore()
const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const filters = ref({
  status: '',
  page: 1
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: '0', label: 'New (Pending)' },
  { value: '1', label: 'Approved' },
  { value: '2', label: 'Rejected' }
]

onMounted(async () => {
  await loadRequests()
})

watch(() => filters.value.status, async () => {
  filters.value.page = 1
  await loadRequests()
})

async function loadRequests() {
  try {
    isLoaded.value = false
    await store.fetchRequests({
      status: filters.value.status,
      page: filters.value.page,
      limit: 20
    })
  } catch (error) {
    console.error('Error loading institution requests:', error)
    showError('Failed to load institution requests')
  } finally {
    isLoaded.value = true
  }
}

async function goToPage(page) {
  filters.value.page = page
  await loadRequests()
}

async function quickApprove(requestId) {
  const result = await store.approveRequest(requestId)
  if (result.success) {
    showSuccess('Institution approved successfully')
    await loadRequests()
  } else {
    showError(result.error || 'Failed to approve institution')
  }
}

async function quickReject(requestId) {
  if (confirm('Are you sure you want to reject this institution? It will remain visible only to the creator.')) {
    const result = await store.rejectRequest(requestId)
    if (result.success) {
      showSuccess('Institution request rejected')
      await loadRequests()
    } else {
      showError(result.error || 'Failed to reject request')
    }
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

function getUrgencyClass(status, createdOn) {
  // Mark new requests older than 7 days as urgent
  if (status === 0) {
    const daysSinceSubmission = (Date.now() - new Date(createdOn).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSubmission > 7) {
      return 'table-warning'
    }
  }
  return ''
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="mb-0">Institution Approval Requests</h1>
        <RouterLink to="/curator" class="btn btn-outline-secondary">
          <i class="fa fa-arrow-left"></i>
          Back to Curator Dashboard
        </RouterLink>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-3">
          <label for="statusFilter" class="form-label">Filter by Status:</label>
          <select 
            id="statusFilter" 
            v-model="filters.status" 
            class="form-select"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="col-md-9 d-flex align-items-end">
          <div class="ms-auto">
            <small class="text-muted">
              Showing {{ store.requests.length }} of {{ store.pagination.total }} requests
            </small>
          </div>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="card">
        <div class="card-body">
          <div v-if="store.requests.length === 0" class="text-center py-4">
            <p class="text-muted">No institution requests found.</p>
          </div>
          
          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Institution Name</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="request in store.requests" 
                  :key="request.request_id"
                  :class="getUrgencyClass(request.status, request.createdOnFormatted)"
                >
                  <td>
                    <strong>#{{ request.request_id }}</strong>
                    <div v-if="getUrgencyClass(request.status, request.createdOnFormatted)" class="small text-warning">
                      <i class="fa fa-clock"></i> Overdue
                    </div>
                  </td>
                  <td>
                    <strong>{{ request.institution?.name || 'Unknown' }}</strong>
                    <div class="small text-muted">
                      ID: {{ request.institution?.institution_id }}
                    </div>
                  </td>
                  <td>
                    <strong>{{ request.User?.fname }} {{ request.User?.lname }}</strong>
                    <br>
                    <small class="text-muted">{{ request.User?.email }}</small>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(request.status)">
                      {{ request.statusLabel }}
                    </span>
                  </td>
                  <td>
                    <div>{{ new Date(request.createdOnFormatted).toLocaleDateString() }}</div>
                    <small class="text-muted">{{ new Date(request.createdOnFormatted).toLocaleTimeString() }}</small>
                  </td>
                  <td>
                    <div class="btn-group">
                      <RouterLink 
                        :to="`/curator/institution-requests/${request.request_id}`" 
                        class="btn btn-sm btn-outline-primary"
                      >
                        View
                      </RouterLink>
                      <button 
                        v-if="request.status === 0"
                        class="btn btn-sm btn-success"
                        @click="quickApprove(request.request_id)"
                        title="Approve"
                      >
                        <i class="fa fa-check"></i>
                      </button>
                      <button 
                        v-if="request.status === 0"
                        class="btn btn-sm btn-danger"
                        @click="quickReject(request.request_id)"
                        title="Reject"
                      >
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <nav v-if="store.pagination.pages > 1" aria-label="Institution requests pagination">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: store.pagination.page === 1 }">
                <button 
                  class="page-link" 
                  @click="goToPage(store.pagination.page - 1)"
                  :disabled="store.pagination.page === 1"
                >
                  Previous
                </button>
              </li>
              <li 
                v-for="page in store.pagination.pages" 
                :key="page"
                class="page-item" 
                :class="{ active: page === store.pagination.page }"
              >
                <button class="page-link" @click="goToPage(page)">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: store.pagination.page === store.pagination.pages }">
                <button 
                  class="page-link" 
                  @click="goToPage(store.pagination.page + 1)"
                  :disabled="store.pagination.page === store.pagination.pages"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
}

.badge {
  font-size: 0.75em;
}

.btn-group .btn {
  border-radius: 0.375rem;
  margin-right: 0.25rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

.table-warning {
  background-color: rgba(255, 193, 7, 0.1);
}
</style>

