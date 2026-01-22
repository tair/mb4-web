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

        <!-- Home Page Dashboard Card -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-home me-2"></i>
                Home Page Dashboard
              </h5>
            </div>
            <div class="card-body">
              <p class="mb-3">
                Manage content displayed on the public MorphoBank homepage.
              </p>
              
              <ul class="list-unstyled small mb-0">
                <li class="mb-2">
                  <i class="fa fa-wrench text-primary me-2"></i>
                  <strong>Tools</strong> - Downloadable resources
                </li>
                <!-- <li class="mb-2">
                  <i class="fa fa-bullhorn text-primary me-2"></i>
                  <strong>Announcements</strong> - Time-sensitive messages
                </li> -->
                <li class="mb-2">
                  <i class="fa fa-image text-primary me-2"></i>
                  <strong>Matrix Images</strong> - Hero/banner images
                </li>
                <li class="mb-2">
                  <i class="fa fa-star text-primary me-2"></i>
                  <strong>Featured Projects</strong> - Slideshow selection
                </li>
                <li>
                  <i class="fa fa-newspaper text-primary me-2"></i>
                  <strong>Press</strong> - News and updates
                </li>
              </ul>
              </div>
            <div class="card-footer">
              <RouterLink to="/admin/homepage" class="btn btn-primary w-100 btn-admin">
                Manage Home Page Content
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Site Statistics Card -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-chart-bar me-2"></i>
                Site Activity Statistics
              </h5>
            </div>
            <div class="card-body">
              <p class="mb-3">
                View all-time site totals and date range activity including projects created/published, user registrations, and media uploads.
              </p>
              
              <ul class="list-unstyled small mb-0">
                <li class="mb-2">
                  <i class="fa fa-database text-primary me-2"></i>
                  <strong>All-Time Totals</strong> - Projects, users, matrices, media, taxa, and more
                </li>
                <li class="mb-2">
                  <i class="fa fa-calendar text-primary me-2"></i>
                  <strong>Date Range Activity</strong> - Projects created/published, user registrations
                </li>
                <li class="mb-2">
                  <i class="fa fa-upload text-primary me-2"></i>
                  <strong>Media Uploads</strong> - Upload tracking by date range
                </li>
                <li>
                  <i class="fa fa-list text-primary me-2"></i>
                  <strong>Detailed Records</strong> - View registrations, publications, and uploads
                </li>
              </ul>
            </div>
            <div class="card-footer">
              <RouterLink to="/admin/statistics" class="btn btn-primary w-100 btn-admin">
                View Site Statistics
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Project Statistics Card -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-table me-2"></i>
                Project List & Statistics
              </h5>
            </div>
            <div class="card-body">
              <p class="mb-3">
                View global totals and browse all projects with per-project statistics including matrices, taxa, media, documents, and members.
              </p>
              
              <ul class="list-unstyled small mb-0">
                <li class="mb-2">
                  <i class="fa fa-globe text-primary me-2"></i>
                  <strong>Global Totals</strong> - Site-wide statistics overview
                </li>
                <li class="mb-2">
                  <i class="fa fa-table text-primary me-2"></i>
                  <strong>Project List</strong> - Searchable table of all projects
                </li>
                <li class="mb-2">
                  <i class="fa fa-chart-bar text-primary me-2"></i>
                  <strong>Per-Project Metrics</strong> - Matrices, taxa, media, docs, members counts
                </li>
                <li>
                  <i class="fa fa-info-circle text-primary me-2"></i>
                  <strong>Project Details</strong> - View detailed statistics for each project
                </li>
              </ul>
            </div>
            <div class="card-footer">
              <RouterLink to="/admin/statistics/projects" class="btn btn-primary w-100 btn-admin">
                View Project Statistics
              </RouterLink>
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
