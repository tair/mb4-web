<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { apiService } from '@/services/apiService.js'
import { useAdminUsersStore } from '@/stores/AdminUsersStore.js'

const isLoaded = ref(false)
const adminUsersStore = useAdminUsersStore()

const maintenanceStatus = ref({
  enabled: false,
  message: '',
})

const userStats = ref({
  totalActive: 0,
  totalInactive: 0,
  pendingApproval: 0,
  total: 0,
})

onMounted(async () => {
  try {
    const [maintenanceResponse] = await Promise.all([
      apiService.get('/admin/maintenance'),
      adminUsersStore.fetchStats().catch(() => {}),
    ])
    
    const maintenanceData = await maintenanceResponse.json()
    if (maintenanceData.success) {
      maintenanceStatus.value = maintenanceData.data
    }
    
    if (adminUsersStore.stats) {
      userStats.value = adminUsersStore.stats
    }
  } catch (error) {
    console.error('Error loading admin dashboard data:', error)
  } finally {
    isLoaded.value = true
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h1>Admin Dashboard</h1>
          <p class="text-muted">Manage site-wide settings and administration features</p>
        </div>
      </div>

      <!-- Admin Cards -->
      <div class="row">
        <!-- User Logins Card -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-users me-2"></i>
                User Logins
              </h5>
              <span v-if="userStats.pendingApproval > 0" class="badge bg-warning text-dark">
                {{ userStats.pendingApproval }} pending
              </span>
            </div>
            <div class="card-body">
              <div class="row text-center mb-3">
                <div class="col-4">
                  <div class="stat-number text-success">{{ userStats.totalActive }}</div>
                  <div class="stat-label">Active</div>
                </div>
                <div class="col-4">
                  <div class="stat-number text-warning">{{ userStats.totalInactive }}</div>
                  <div class="stat-label">Inactive</div>
                </div>
                <div class="col-4">
                  <div class="stat-number text-primary">{{ userStats.total }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </div>
              
              <div v-if="userStats.pendingApproval > 0" class="alert alert-warning small mb-0">
                <i class="fa fa-clock me-2"></i>
                {{ userStats.pendingApproval }} user(s) awaiting approval
              </div>
              <div v-else class="text-muted small">
                <i class="fa fa-check-circle me-2 text-success"></i>
                No users pending approval
              </div>
            </div>
            <div class="card-footer">
              <RouterLink to="/admin/users" class="btn btn-primary w-100 btn-admin">
                Manage Users
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Maintenance Message Card -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-wrench me-2"></i>
                Maintenance Message
              </h5>
              <span
                v-if="maintenanceStatus.enabled"
                class="badge bg-success"
              >Active</span>
              <span v-else class="badge bg-secondary">Inactive</span>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Status:</strong>
                <span v-if="maintenanceStatus.enabled" class="text-success ms-2">
                  Enabled
                </span>
                <span v-else class="text-muted ms-2">Disabled</span>
              </div>

              <div v-if="maintenanceStatus.message" class="mb-3">
                <strong>Current Message:</strong>
                <p class="text-muted small mt-1 mb-0 message-preview">
                  {{ maintenanceStatus.message.substring(0, 100) }}{{ maintenanceStatus.message.length > 100 ? '...' : '' }}
                </p>
              </div>
              <div v-else class="mb-3">
                <span class="text-muted">No message configured</span>
              </div>
            </div>
            <div class="card-footer">
              <RouterLink to="/admin/maintenance" class="btn btn-primary w-100 btn-admin">
                Manage Maintenance Message
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Placeholder for future admin features -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 bg-light">
            <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
              <div class="text-muted mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                </svg>
              </div>
              <p class="text-muted mb-0">Additional admin features can be added here</p>
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

.message-preview {
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  font-style: italic;
}

.bg-light {
  min-height: 200px;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-admin {
  color: #ffffff !important;
}

.btn-admin:hover {
  color: #ffffff !important;
}
</style>
