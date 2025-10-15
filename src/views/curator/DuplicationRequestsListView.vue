<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { apiService } from '@/services/apiService.js'

const isLoaded = ref(false)
const requests = ref([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  pages: 0
})
const filters = ref({
  status: '',
  page: 1
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: '1', label: 'Newly Submitted' },
  { value: '50', label: 'Approved' },
  { value: '100', label: 'Completed' },
  { value: '200', label: 'Denied' }
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
    
    const params = new URLSearchParams()
    if (filters.value.status) params.append('status', filters.value.status)
    params.append('page', filters.value.page)
    params.append('limit', pagination.value.limit)
    
    const response = await apiService.get(`/duplication-requests?${params}`)
    const data = await response.json()
    
    if (data.success) {
      requests.value = data.data.requests
      pagination.value = data.data.pagination
    }
  } catch (error) {
    console.error('Error loading duplication requests:', error)
  } finally {
    isLoaded.value = true
  }
}

async function goToPage(page) {
  filters.value.page = page
  await loadRequests()
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 1:
      return 'bg-warning text-dark'
    case 50:
      return 'bg-info'
    case 100:
      return 'bg-success'
    case 200:
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

function getUrgencyClass(status, createdOn) {
  // Mark newly submitted requests older than 7 days as urgent
  if (status === 1) {
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
        <h1 class="mb-0">Project Duplication Requests</h1>
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
              Showing {{ requests.length }} of {{ pagination.total }} requests
            </small>
          </div>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="card">
        <div class="card-body">
          <div v-if="requests.length === 0" class="text-center py-4">
            <p class="text-muted">No duplication requests found.</p>
          </div>
          
          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Project</th>
                  <th>Requester</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>One-time Media</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="request in requests" 
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
                    <RouterLink 
                      :to="`/myprojects/${request.project_id}/overview`" 
                      target="_blank"
                      class="text-decoration-none"
                    >
                      <strong>P{{ request.project_id }}</strong>
                      <br>
                      <span class="text-muted">{{ request.Project.name || 'Untitled' }}</span>
                    </RouterLink>
                    <div class="small">
                      <span :class="request.Project.published ? 'text-success' : 'text-warning'">
                        {{ request.Project.published ? 'Published' : 'Unpublished' }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{{ request.User.fname }} {{ request.User.lname }}</strong>
                    <br>
                    <small class="text-muted">{{ request.User.email }}</small>
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
                    <span v-if="request.onetime_use_action === 1" class="badge bg-secondary">Keep</span>
                    <span v-else-if="request.onetime_use_action === 100" class="badge bg-primary">Move</span>
                    <span v-else class="text-muted">N/A</span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <RouterLink 
                        :to="`/curator/duplication-requests/${request.request_id}`" 
                        class="btn btn-sm btn-outline-primary"
                      >
                        View
                      </RouterLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <nav v-if="pagination.pages > 1" aria-label="Duplication requests pagination">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                <button 
                  class="page-link" 
                  @click="goToPage(pagination.page - 1)"
                  :disabled="pagination.page === 1"
                >
                  Previous
                </button>
              </li>
              <li 
                v-for="page in pagination.pages" 
                :key="page"
                class="page-item" 
                :class="{ active: page === pagination.page }"
              >
                <button class="page-link" @click="goToPage(page)">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page === pagination.pages }">
                <button 
                  class="page-link" 
                  @click="goToPage(pagination.page + 1)"
                  :disabled="pagination.page === pagination.pages"
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
