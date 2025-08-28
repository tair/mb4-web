<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const isLoaded = ref(false)
const stats = ref({
  counts: {
    newly_submitted: 0,
    approved: 0,
    completed: 0,
    denied: 0,
    total: 0
  },
  recent_requests: []
})

onMounted(async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/duplication-requests/stats?limit=10`)
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading curator stats:', error)
  } finally {
    isLoaded.value = true
  }
})

function getStatusBadgeClass(status) {
  switch (status) {
    case 1:
      return 'bg-warning'
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
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <!-- Duplication Requests Section -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="card-title mb-0 text-white">Project Duplication Requests</h3>
              <RouterLink to="/curator/duplication-requests" class="btn btn-secondary">
                See All Requests
              </RouterLink>
            </div>
            <div class="card-body">
              <!-- Stats Overview -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="card bg-warning text-dark">
                    <div class="card-body text-center">
                      <h2 class="card-title">{{ stats.counts.newly_submitted }}</h2>
                      <p class="card-text">Pending Review</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-info text-white">
                    <div class="card-body text-center">
                      <h2 class="card-title">{{ stats.counts.approved }}</h2>
                      <p class="card-text">Processing</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-success text-white">
                    <div class="card-body text-center">
                      <h2 class="card-title">{{ stats.counts.completed }}</h2>
                      <p class="card-text">Completed</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-danger text-white">
                    <div class="card-body text-center">
                      <h2 class="card-title">{{ stats.counts.denied }}</h2>
                      <p class="card-text">Denied</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Requests -->
              <div v-if="stats.recent_requests.length > 0">
                <h4>Recent Requests</h4>
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Project</th>
                        <th>Requester</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="request in stats.recent_requests" :key="request.request_id">
                        <td>#{{ request.request_id }}</td>
                        <td>
                          <RouterLink :to="`/myprojects/${request.project_id}/overview`" target="_blank">
                            P{{ request.project_id }} - {{ request.Project.name || 'Untitled' }}
                          </RouterLink>
                        </td>
                        <td>{{ request.User.fname }} {{ request.User.lname }}</td>
                        <td>
                          <span class="badge" :class="getStatusBadgeClass(request.status)">
                            {{ request.statusLabel }}
                          </span>
                        </td>
                        <td>{{ new Date(request.createdOnFormatted).toLocaleDateString() }}</td>
                        <td>
                          <RouterLink 
                            :to="`/curator/duplication-requests/${request.request_id}`" 
                            class="btn btn-sm btn-outline-primary"
                          >
                            View
                          </RouterLink>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-center text-muted">
                <p>No recent duplication requests</p>
              </div>
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

.card-title {
  color: #495057;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
}

.badge {
  font-size: 0.75em;
}
</style>
