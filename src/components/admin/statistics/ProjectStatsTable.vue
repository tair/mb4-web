<template>
  <div class="card shadow-sm border-0">
    <div class="card-header text-white d-flex justify-content-between align-items-center py-3" style="background-color: #ef782f;">
      <h5 class="card-title mb-0 text-white">
        <i class="fa fa-table me-2"></i>
        Project Statistics
      </h5>
      <div v-if="!loading && pagination.totalPages > 1" class="d-flex align-items-center">
        <span class="me-2 text-white small opacity-75">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <div class="btn-group btn-group-sm">
          <button 
            class="btn btn-outline-light border-0" 
            @click="changePage(pagination.page - 1)" 
            :disabled="pagination.page <= 1"
          >
            <i class="fa fa-chevron-left"></i>
          </button>
          <button 
            class="btn btn-outline-light border-0" 
            @click="changePage(pagination.page + 1)" 
            :disabled="pagination.page >= pagination.totalPages"
          >
            <i class="fa fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="card-body p-0">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else class="table-responsive">
        <table class="table table-striped table-hover align-middle mb-0">
          <thead class="table-light sticky-top">
            <tr>
              <th @click="handleSort('project_id')" class="sortable text-nowrap">
                ID
                <i v-if="sort.field === 'project_id'" 
                   :class="sort.order === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"
                   class="ms-1"></i>
              </th>
              <th @click="handleSort('name')" class="sortable text-nowrap">
                Name / Admin
                <i v-if="sort.field === 'name'" 
                   :class="sort.order === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"
                   class="ms-1"></i>
              </th>
              <th @click="handleSort('published')" class="sortable text-center text-nowrap">
                Published
                <i v-if="sort.field === 'published'" 
                   :class="sort.order === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"
                   class="ms-1"></i>
              </th>
              <th @click="handleSort('created_on')" class="sortable text-nowrap">
                Created
                <i v-if="sort.field === 'created_on'" 
                   :class="sort.order === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"
                   class="ms-1"></i>
              </th>
              <th class="text-center text-nowrap"><i class="fa fa-th me-1 text-muted"></i>Matrices</th>
              <th class="text-center text-nowrap"><i class="fa fa-leaf me-1 text-muted"></i>Taxa</th>
              <th class="text-center text-nowrap"><i class="fa fa-image me-1 text-muted"></i>Media</th>
              <th class="text-center text-nowrap"><i class="fa fa-file-alt me-1 text-muted"></i>Docs</th>
              <th class="text-center text-nowrap"><i class="fa fa-users me-1 text-muted"></i>Members</th>
              <th class="text-center text-nowrap">More Statistics</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.projectId">
              <td>{{ project.projectId }}</td>
              <td>
                <div class="fw-bold mb-1">
                  <RouterLink 
                    :to="getProjectUrl(project)" 
                    class="project-name-link"
                  >
                    {{ project.name }}
                  </RouterLink>
                </div>
                <div class="small text-muted d-flex align-items-center">
                  <i class="fa fa-user-circle me-1 opacity-50"></i>
                  {{ project.administrator }}
                </div>
              </td>
              <td class="text-center">
                <span v-if="project.published" class="badge bg-success rounded-pill">Published</span>
                <span v-else class="badge bg-secondary rounded-pill">Unpublished</span>
              </td>
              <td>{{ formatDate(project.createdOn) }}</td>
              <td class="text-center">{{ project.numMatrices || 0 }}</td>
              <td class="text-center">{{ project.numTaxa || 0 }}</td>
              <td class="text-center">{{ project.numMedia || 0 }}</td>
              <td class="text-center">{{ project.numDocs || 0 }}</td>
              <td class="text-center">{{ project.numMembers || 0 }}</td>
              <td class="text-center">
                <button 
                  class="btn btn-sm btn-outline-primary"
                  @click="$emit('view-details', project.projectId)"
                  title="View detailed statistics"
                >
                  <i class="fa fa-chart-bar me-1"></i> Details
                </button>
              </td>
            </tr>
            <tr v-if="projects.length === 0">
              <td colspan="10" class="text-center text-muted py-5">
                <i class="fa fa-folder-open fa-3x mb-3 opacity-25"></i>
                <p class="mb-0">No projects found matching your criteria.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Pagination -->
    <div v-if="!loading && pagination.totalPages > 1" class="card-footer">
      <nav aria-label="Project pagination">
        <ul class="pagination pagination-sm justify-content-center mb-0">
          <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
            <button class="page-link" @click="changePage(1)" :disabled="pagination.page <= 1">
              <i class="fa fa-angle-double-left"></i>
            </button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
            <button class="page-link" @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1">
              <i class="fa fa-angle-left"></i>
            </button>
          </li>
          
          <li v-for="pageNum in visiblePages" :key="pageNum" 
              class="page-item" 
              :class="{ active: pageNum === pagination.page }">
            <button class="page-link" @click="changePage(pageNum)">
              {{ pageNum }}
            </button>
          </li>
          
          <li class="page-item" :class="{ disabled: pagination.page >= pagination.totalPages }">
            <button class="page-link" @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.totalPages">
              <i class="fa fa-angle-right"></i>
            </button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.page >= pagination.totalPages }">
            <button class="page-link" @click="changePage(pagination.totalPages)" :disabled="pagination.page >= pagination.totalPages">
              <i class="fa fa-angle-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
      <div class="text-center mt-2">
        <small class="text-muted">
          Page {{ pagination.page }} of {{ pagination.totalPages }} 
          ({{ pagination.totalItems }} total projects)
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({ page: 1, limit: 50, totalItems: 0, totalPages: 0 })
  },
  sort: {
    type: Object,
    default: () => ({ field: 'project_id', order: 'desc' })
  }
})

const emit = defineEmits(['page-change', 'sort-change', 'view-details'])

const visiblePages = computed(() => {
  const total = props.pagination.totalPages
  const current = props.pagination.page
  const pages = []
  
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  // Adjust to always show 5 pages if possible
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else if (end === total) {
      start = Math.max(1, end - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

function changePage(page) {
  if (page >= 1 && page <= props.pagination.totalPages) {
    emit('page-change', page)
  }
}

function handleSort(field) {
  const newOrder = props.sort.field === field && props.sort.order === 'asc' ? 'desc' : 'asc'
  emit('sort-change', { field, order: newOrder })
}

function formatDate(timestamp) {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString()
}

function getProjectUrl(project) {
  if (project.published) {
    return `/project/${project.projectId}/overview`
  } else {
    return `/myprojects/${project.projectId}/overview`
  }
}
</script>

<style scoped>
.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.table th.sortable {
  cursor: pointer;
  user-select: none;
}

.table th.sortable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.table td {
  font-size: 0.875rem;
  vertical-align: middle;
}

/* .card-title {
  color: #495057;
} */

.pagination .page-link {
  padding: 0.25rem 0.5rem;
}

.project-name-link {
  color: #0d6efd;
  text-decoration: none;
}

.project-name-link:hover {
  color: #0a58ca;
  text-decoration: underline;
}
</style>
