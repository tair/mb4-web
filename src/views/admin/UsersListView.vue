<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useAdminUsersStore } from '@/stores/AdminUsersStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import UserDeleteDialog from './UserDeleteDialog.vue'

const router = useRouter()
const adminUsersStore = useAdminUsersStore()
const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const searchInput = ref('')
const searchDebounceTimer = ref(null)
const userToDelete = ref(null)
const showDeleteDialog = ref(false)

// Filter options
const statusOptions = [
  { value: 'active', label: 'Active Users' },
  { value: 'inactive', label: 'Inactive Users' },
  { value: 'deleted', label: 'Deleted Users' },
  { value: 'all', label: 'All Users' },
]

// Computed properties
const users = computed(() => adminUsersStore.users)
const pagination = computed(() => adminUsersStore.pagination)
const filters = computed(() => adminUsersStore.filters)
const isTableLoading = computed(() => adminUsersStore.isLoading)

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

// Get status badge class
function getStatusBadgeClass(status) {
  switch (status) {
    case 'active':
      return 'bg-success'
    case 'inactive':
      return 'bg-warning text-dark'
    case 'deleted':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

// Handle search input with debounce
function handleSearchInput() {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  searchDebounceTimer.value = setTimeout(() => {
    adminUsersStore.setFilters({ search: searchInput.value })
  }, 300)
}

// Handle status filter change
function handleStatusChange(event) {
  adminUsersStore.setFilters({ status: event.target.value })
}

// Handle sorting
function handleSort(column) {
  const currentSortBy = filters.value.sortBy
  const currentSortOrder = filters.value.sortOrder

  if (currentSortBy === column) {
    // Toggle sort order
    adminUsersStore.setFilters({
      sortOrder: currentSortOrder === 'asc' ? 'desc' : 'asc',
    })
  } else {
    adminUsersStore.setFilters({ sortBy: column, sortOrder: 'asc' })
  }
}

// Get sort icon
function getSortIcon(column) {
  if (filters.value.sortBy !== column) return 'fa-sort'
  return filters.value.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
}

// Handle pagination
function goToPage(page) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    adminUsersStore.setPage(page)
  }
}

// Generate page numbers for pagination
const pageNumbers = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  
  return pages
})

// Quick actions
async function handleActivate(user) {
  try {
    await adminUsersStore.activateUser(user.user_id, true)
    showSuccess(`User ${user.email} has been activated`)
  } catch (error) {
    showError(error.message || 'Failed to activate user')
  }
}

async function handleDeactivate(user) {
  try {
    await adminUsersStore.deactivateUser(user.user_id)
    showSuccess(`User ${user.email} has been deactivated`)
  } catch (error) {
    showError(error.message || 'Failed to deactivate user')
  }
}

function handleEdit(user) {
  router.push({ name: 'AdminUsersEdit', params: { userId: user.user_id } })
}

function handleDelete(user) {
  userToDelete.value = user
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!userToDelete.value) return
  
  try {
    await adminUsersStore.deleteUser(userToDelete.value.user_id)
    showSuccess(`User ${userToDelete.value.email} has been deleted`)
    showDeleteDialog.value = false
    userToDelete.value = null
  } catch (error) {
    showError(error.message || 'Failed to delete user')
  }
}

function cancelDelete() {
  showDeleteDialog.value = false
  userToDelete.value = null
}

// Initialize
onMounted(async () => {
  try {
    searchInput.value = filters.value.search
    await adminUsersStore.fetchUsers()
  } catch (error) {
    showError('Failed to load users')
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
              <li class="breadcrumb-item active" aria-current="page">
                User Logins
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h1 class="mb-1">User Logins</h1>
            <p class="text-muted mb-0">
              Manage all registered users in the system
            </p>
          </div>
          <div class="d-flex gap-2">
            <RouterLink to="/admin/users/merge" class="btn btn-outline-primary">
              <i class="fa fa-compress-arrows-alt me-2"></i>
              Merge Users
            </RouterLink>
            <RouterLink to="/admin/users/create" class="btn btn-primary btn-admin">
              <i class="fa fa-plus me-2"></i>
              Create New User
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-4">
          <label for="statusFilter" class="form-label">Status Filter</label>
          <select
            id="statusFilter"
            class="form-select"
            :value="filters.status"
            @change="handleStatusChange"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="col-md-8">
          <label for="searchInput" class="form-label">Search</label>
          <div class="input-group">
            <span class="input-group-text">
              <i class="fa fa-search"></i>
            </span>
            <input
              id="searchInput"
              type="text"
              class="form-control"
              placeholder="Search by name or email..."
              v-model="searchInput"
              @input="handleSearchInput"
            />
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th
                    class="sortable"
                    @click="handleSort('email')"
                  >
                    Email
                    <i :class="['fa', 'ms-1', getSortIcon('email')]"></i>
                  </th>
                  <th
                    class="sortable"
                    @click="handleSort('lname')"
                  >
                    Name
                    <i :class="['fa', 'ms-1', getSortIcon('lname')]"></i>
                  </th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th class="text-center">Terms</th>
                  <th class="text-center">Profile Updated</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="isTableLoading">
                  <tr>
                    <td colspan="7" class="text-center py-5">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                </template>
                <template v-else-if="users.length === 0">
                  <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                      <i class="fa fa-users fa-3x mb-3 d-block"></i>
                      No users found matching your criteria
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr v-for="user in users" :key="user.user_id">
                    <td>
                      <RouterLink
                        :to="{ name: 'AdminUsersEdit', params: { userId: user.user_id } }"
                        class="text-decoration-none"
                      >
                        {{ user.email }}
                      </RouterLink>
                      <span v-if="user.orcid" class="ms-2" title="ORCID linked">
                        <img
                          src="/ORCIDiD_iconvector.svg"
                          alt="ORCID"
                          style="width: 16px; height: 16px;"
                        />
                      </span>
                    </td>
                    <td>{{ user.name }}</td>
                    <td>
                      <span :class="['badge', getStatusBadgeClass(user.status)]">
                        {{ user.status }}
                      </span>
                    </td>
                    <td>{{ formatDate(user.lastLoginAt) }}</td>
                    <td class="text-center">
                      <i
                        :class="[
                          'fa',
                          user.acceptedTerms ? 'fa-check text-success' : 'fa-times text-muted'
                        ]"
                      ></i>
                    </td>
                    <td class="text-center">
                      <i
                        :class="[
                          'fa',
                          user.hasUpdatedProfile ? 'fa-check text-success' : 'fa-times text-muted'
                        ]"
                      ></i>
                    </td>
                    <td class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button
                          type="button"
                          class="btn btn-outline-primary"
                          title="Edit user"
                          @click="handleEdit(user)"
                        >
                          <i class="fa fa-edit"></i>
                        </button>
                        <button
                          v-if="!user.active && user.status !== 'deleted'"
                          type="button"
                          class="btn btn-outline-success"
                          title="Activate user"
                          @click="handleActivate(user)"
                        >
                          <i class="fa fa-check"></i>
                        </button>
                        <button
                          v-if="user.active && user.status !== 'deleted'"
                          type="button"
                          class="btn btn-outline-warning"
                          title="Deactivate user"
                          @click="handleDeactivate(user)"
                        >
                          <i class="fa fa-ban"></i>
                        </button>
                        <button
                          v-if="user.status !== 'deleted'"
                          type="button"
                          class="btn btn-outline-danger"
                          title="Delete user"
                          @click="handleDelete(user)"
                        >
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="card-footer d-flex justify-content-between align-items-center" v-if="pagination.totalPages > 1">
          <div class="text-muted small">
            Showing {{ (pagination.page - 1) * pagination.perPage + 1 }} to
            {{ Math.min(pagination.page * pagination.perPage, pagination.total) }}
            of {{ pagination.total }} users
          </div>
          <nav aria-label="User list pagination">
            <ul class="pagination pagination-sm mb-0">
              <li :class="['page-item', { disabled: pagination.page === 1 }]">
                <button class="page-link" @click="goToPage(pagination.page - 1)">
                  <i class="fa fa-chevron-left"></i>
                </button>
              </li>
              <template v-for="pageNum in pageNumbers" :key="pageNum">
                <li v-if="pageNum === '...'" class="page-item disabled">
                  <span class="page-link">...</span>
                </li>
                <li v-else :class="['page-item', { active: pagination.page === pageNum }]">
                  <button class="page-link" @click="goToPage(pageNum)">
                    {{ pageNum }}
                  </button>
                </li>
              </template>
              <li :class="['page-item', { disabled: pagination.page === pagination.totalPages }]">
                <button class="page-link" @click="goToPage(pagination.page + 1)">
                  <i class="fa fa-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <UserDeleteDialog
      :show="showDeleteDialog"
      :user="userToDelete"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </LoadingIndicator>
</template>

<style scoped>
.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #f8f9fa;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.table th {
  font-weight: 600;
  white-space: nowrap;
}

.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin-bottom: 0;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

.btn-admin {
  color: #ffffff !important;
}

.btn-admin:hover {
  color: #ffffff !important;
}
</style>

