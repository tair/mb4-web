<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import Alert from '@/components/main/Alert.vue'

const route = useRoute()
const router = useRouter()
const requestId = route.params.requestId

const isLoaded = ref(false)
const request = ref(null)
const notes = ref('')
const isUpdating = ref(false)

const validationMessages = ref({
  error: '',
  success: ''
})

onMounted(async () => {
  await loadRequest()
})

async function loadRequest() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/duplication-requests/${requestId}`)
    
    if (response.data.success) {
      request.value = response.data.data
      notes.value = ''
    }
  } catch (error) {
    console.error('Error loading duplication request:', error)
    validationMessages.value.error = 'Failed to load duplication request'
  } finally {
    isLoaded.value = true
  }
}

async function updateStatus(newStatus) {
  // Validate denial notes
  if (newStatus === 200 && (!notes.value || notes.value.trim().length === 0)) {
    validationMessages.value.error = 'Notes are required when denying a request'
    return
  }

  try {
    isUpdating.value = true
    validationMessages.value.error = ''
    validationMessages.value.success = ''

    const response = await axios.put(`${import.meta.env.VITE_API_URL}/duplication-requests/${requestId}`, {
      status: newStatus,
      notes: notes.value
    })

    if (response.data.success) {
      validationMessages.value.success = 'Request updated successfully!'
      await loadRequest() // Reload to get updated data
    }
  } catch (error) {
    console.error('Error updating request:', error)
    validationMessages.value.error = error.response?.data?.message || 'Failed to update request'
  } finally {
    isUpdating.value = false
  }
}

async function deleteRequest() {
  if (!confirm('Are you sure you want to delete this duplication request? This action cannot be undone.')) {
    return
  }

  try {
    isUpdating.value = true
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}/duplication-requests/${requestId}`)
    
    if (response.data.success) {
      router.push('/curator/duplication-requests')
    }
  } catch (error) {
    console.error('Error deleting request:', error)
    validationMessages.value.error = error.response?.data?.message || 'Failed to delete request'
  } finally {
    isUpdating.value = false
  }
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

function canApprove() {
  return request.value && request.value.status === 1
}

function canDeny() {
  return request.value && (request.value.status === 1 || request.value.status === 50)
}

function canDelete() {
  return request.value && request.value.status !== 50 && request.value.status !== 100
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid" v-if="request">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="mb-0">Duplication Request #{{ requestId }}</h1>
        <RouterLink to="/curator/duplication-requests" class="btn btn-outline-secondary">
          <i class="fa fa-arrow-left"></i>
          Back to Requests List
        </RouterLink>
      </div>

      <!-- Alert Messages -->
      <Alert
        :message="validationMessages"
        messageName="error"
        alertType="danger"
      />
      
      <Alert
        :message="validationMessages"
        messageName="success"
        alertType="success"
      />

      <div class="row">
        <!-- Request Details -->
        <div class="col-lg-8">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="card-title mb-0">Request Information</h3>
              <span class="badge fs-6" :class="getStatusBadgeClass(request.status)">
                {{ request.statusLabel }}
              </span>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h5>Requester Information</h5>
                  <p><strong>Name:</strong> {{ request.User.fname }} {{ request.User.lname }}</p>
                  <p><strong>Email:</strong> 
                    <a :href="`mailto:${request.User.email}`">{{ request.User.email }}</a>
                  </p>
                  <p><strong>Request Date:</strong> {{ new Date(request.createdOnFormatted).toLocaleString() }}</p>
                </div>
                <div class="col-md-6">
                  <h5>Project Information</h5>
                  <p><strong>Project ID:</strong> P{{ request.project_id }}</p>
                  <p><strong>Project Name:</strong> {{ request.Project.name || 'Untitled' }}</p>
                  <p><strong>Project Status:</strong> 
                    <span :class="request.Project.published ? 'text-success' : 'text-warning'">
                      {{ request.Project.published ? 'Published' : 'Unpublished' }}
                    </span>
                  </p>
                  <p><strong>Project Owner:</strong> 
                    {{ request.Project.User.fname }} {{ request.Project.User.lname }}
                  </p>
                  <RouterLink 
                    :to="`/myprojects/${request.project_id}/overview`" 
                    target="_blank"
                    class="btn btn-outline-primary btn-sm"
                  >
                    View Project <i class="fa fa-external-link"></i>
                  </RouterLink>
                </div>
              </div>
              
              <hr>

              <!-- Request Remarks -->
              <h5>Request Justification</h5>
              <div class="bg-light p-3 rounded">
                <pre class="mb-0" style="white-space: pre-wrap; font-family: inherit;">{{ request.request_remarks }}</pre>
              </div>

              <!-- One-time Media Action -->
              <div v-if="request.onetime_use_action" class="mt-3">
                <h5>One-time Use Media Action</h5>
                <span v-if="request.onetime_use_action === 1" class="badge bg-secondary fs-6">
                  Keep one-time media in original project
                </span>
                <span v-else-if="request.onetime_use_action === 100" class="badge bg-primary fs-6">
                  Move one-time media to new project
                </span>
              </div>

              <!-- Completed Request Info -->
              <div v-if="request.status === 100 && request.new_project_number && request.new_project_number !== '0'" class="mt-3">
                <h5>Duplicated Project</h5>
                <p>
                  <strong>New Project ID:</strong> P{{ request.new_project_number }}
                  <RouterLink 
                    :to="`/myprojects/${request.new_project_number}/overview`" 
                    target="_blank"
                    class="btn btn-outline-primary btn-sm ms-2"
                  >
                    View New Project <i class="fa fa-external-link"></i>
                  </RouterLink>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Panel -->
        <div class="col-lg-4">
          <!-- Curator Actions -->
          <div class="card mb-4">
            <div class="card-header">
              <h4 class="card-title mb-0">Curator Actions</h4>
            </div>
            <div class="card-body">
              <!-- Notes -->
              <div class="mb-3">
                <label for="curatorNotes" class="form-label">
                  Curator Notes
                  <span v-if="request.status === 1" class="text-danger">*Required for denial</span>
                </label>
                <textarea
                  id="curatorNotes"
                  v-model="notes"
                  class="form-control"
                  rows="4"
                  placeholder="Add notes about this request..."
                  :disabled="isUpdating"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="d-grid gap-2">
                <button 
                  v-if="canApprove()"
                  @click="updateStatus(50)" 
                  class="btn btn-success"
                  :disabled="isUpdating"
                >
                  <i class="fa fa-check"></i>
                  {{ isUpdating ? 'Processing...' : 'Approve Request' }}
                </button>

                <button 
                  v-if="canDeny()"
                  @click="updateStatus(200)" 
                  class="btn btn-danger"
                  :disabled="isUpdating || (!notes.trim() && request.status === 1)"
                >
                  <i class="fa fa-times"></i>
                  {{ isUpdating ? 'Processing...' : 'Deny Request' }}
                </button>

                <button 
                  v-if="request.status !== 1 && request.status !== 200"
                  @click="updateStatus(1)" 
                  class="btn btn-warning"
                  :disabled="isUpdating"
                >
                  <i class="fa fa-undo"></i>
                  {{ isUpdating ? 'Processing...' : 'Reset to Submitted' }}
                </button>

                <button 
                  @click="loadRequest()" 
                  class="btn btn-outline-secondary"
                  :disabled="isUpdating"
                >
                  <i class="fa fa-refresh"></i>
                  Refresh Data
                </button>

                <hr>

                <button 
                  v-if="canDelete()"
                  @click="deleteRequest" 
                  class="btn btn-outline-danger"
                  :disabled="isUpdating"
                >
                  <i class="fa fa-trash"></i>
                  {{ isUpdating ? 'Deleting...' : 'Delete Request' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Status History -->
          <div class="card">
            <div class="card-header">
              <h4 class="card-title mb-0">Request Timeline</h4>
            </div>
            <div class="card-body">
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-marker bg-primary"></div>
                  <div class="timeline-content">
                    <p class="mb-0"><strong>Request Submitted</strong></p>
                    <small class="text-muted">{{ new Date(request.createdOnFormatted).toLocaleString() }}</small>
                  </div>
                </div>
                
                <div v-if="request.status >= 50" class="timeline-item">
                  <div class="timeline-marker" :class="request.status === 50 ? 'bg-info' : request.status === 100 ? 'bg-success' : 'bg-danger'"></div>
                  <div class="timeline-content">
                    <p class="mb-0">
                      <strong>
                        {{ request.status === 50 ? 'Approved' : request.status === 100 ? 'Completed' : 'Status Updated' }}
                      </strong>
                    </p>
                    <small class="text-muted">By curator</small>
                  </div>
                </div>

                <div v-if="request.status === 100 && request.new_project_number !== '0'" class="timeline-item">
                  <div class="timeline-marker bg-success"></div>
                  <div class="timeline-content">
                    <p class="mb-0"><strong>Project Duplicated</strong></p>
                    <small class="text-muted">New project P{{ request.new_project_number }} created</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isLoaded" class="container-fluid">
      <div class="text-center">
        <h2>Request Not Found</h2>
        <p class="text-muted">The duplication request you're looking for doesn't exist or you don't have permission to view it.</p>
        <RouterLink to="/curator/duplication-requests" class="btn btn-primary">
          Back to Requests List
        </RouterLink>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #dee2e6;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-marker {
  position: absolute;
  left: -22px;
  top: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.timeline-content {
  padding-left: 10px;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.badge.fs-6 {
  font-size: 0.875rem;
}

pre {
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
