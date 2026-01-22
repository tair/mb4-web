<template>
  <div class="project-statistics">
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h1>Project Statistics</h1>
          <p class="text-muted">
            Statistics are totals of all records in the database. 
            Source (HTML5 editor vs. FLASH editor) is being tracked as of May 2016.
            Taxonomic Authority Checker stats are available as of July 2016.
          </p>
        </div>
      </div>

      <!-- Global Totals -->
      <StatsTotalsCard
        v-if="projectStatsTotals || isLoadingProjectStats"
        title="Global Totals"
        icon="fa fa-globe"
        :stats="projectStatsTotals"
        :loading="isLoadingProjectStats && !projectStatsTotals"
      />

      <!-- Search Bar -->
      <div class="row mb-3">
        <div class="col-md-4">
          <div class="input-group">
            <input
              v-model="searchTerm"
              type="text"
              class="form-control"
              placeholder="Search projects by name..."
              @keyup.enter="handleSearch"
            />
            <button class="btn btn-primary" @click="handleSearch">
              <i class="fa fa-search"></i>
            </button>
            <button 
              v-if="searchTerm" 
              class="btn btn-outline-secondary" 
              @click="clearSearch"
            >
              <i class="fa fa-times"></i>
            </button>
          </div>
        </div>
        <div class="col-md-8 text-end">
          <span class="text-muted">
            Showing {{ projectsList.length }} of {{ pagination.totalItems }} projects
          </span>
        </div>
      </div>

      <!-- Projects Table -->
      <ProjectStatsTable
        :projects="projectsList"
        :loading="isLoadingProjectStats"
        :pagination="pagination"
        :sort="projectsSort"
        @page-change="handlePageChange"
        @sort-change="handleSortChange"
        @view-details="handleViewDetails"
      />

      <!-- Project Details Modal -->
      <div 
        v-if="showDetailsModal" 
        class="modal fade show d-block" 
        tabindex="-1"
        @click.self="closeDetailsModal"
      >
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Project Details: {{ selectedProjectDetails?.name || 'Loading...' }}
              </h5>
              <button type="button" class="btn-close" @click="closeDetailsModal"></button>
            </div>
            <div class="modal-body">
              <div v-if="isLoadingDetail" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else-if="selectedProjectDetails">
                <div class="row">
                  <div class="col-md-6">
                    <h6>Basic Info</h6>
                    <table class="table table-sm">
                      <tbody>
                        <tr>
                          <th>Project ID</th>
                          <td>{{ selectedProjectDetails.projectId }}</td>
                        </tr>
                        <tr>
                          <th>Administrator</th>
                          <td>{{ selectedProjectDetails.administrator }}</td>
                        </tr>
                        <tr>
                          <th>Published</th>
                          <td>
                            <span :class="selectedProjectDetails.published ? 'badge bg-success' : 'badge bg-warning'">
                              {{ selectedProjectDetails.published ? 'Yes' : 'No' }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Created</th>
                          <td>{{ formatDate(selectedProjectDetails.createdOn) }}</td>
                        </tr>
                        <tr>
                          <th>Last Accessed</th>
                          <td>{{ formatDate(selectedProjectDetails.lastAccessedOn) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="col-md-6">
                    <h6>Statistics</h6>
                    <table class="table table-sm">
                      <tbody>
                        <tr>
                          <th>Matrices</th>
                          <td>{{ selectedProjectDetails.numMatrices || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Taxa</th>
                          <td>{{ selectedProjectDetails.numTaxa || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Characters</th>
                          <td>{{ selectedProjectDetails.numCharacters || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Cells</th>
                          <td>{{ selectedProjectDetails.numCells || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Media</th>
                          <td>{{ selectedProjectDetails.numMedia || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Specimens</th>
                          <td>{{ selectedProjectDetails.numSpecimens || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Documents</th>
                          <td>{{ selectedProjectDetails.numDocs || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Partitions</th>
                          <td>{{ selectedProjectDetails.numPartitions || 0 }}</td>
                        </tr>
                        <tr>
                          <th>Members</th>
                          <td>{{ selectedProjectDetails.numMembers || 0 }}</td>
                        </tr>
                        <tr>
                          <th>CIPRES Requests</th>
                          <td>{{ selectedProjectDetails.numCipresRequests || 0 }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showDetailsModal" class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStatisticsStore } from '@/stores/AdminStatisticsStore.js'
import StatsTotalsCard from '@/components/admin/statistics/StatsTotalsCard.vue'
import ProjectStatsTable from '@/components/admin/statistics/ProjectStatsTable.vue'

const store = useAdminStatisticsStore()

const searchTerm = ref('')
const showDetailsModal = ref(false)

const projectStatsTotals = computed(() => store.projectStatsTotals)
const projectsList = computed(() => store.projectsList)
const isLoadingProjectStats = computed(() => store.isLoadingProjectStats)
const isLoadingDetail = computed(() => store.isLoadingDetail)
const pagination = computed(() => store.projectsPagination)
const projectsSort = computed(() => store.projectsSort)
const selectedProjectDetails = computed(() => store.selectedProjectDetails)

async function handleSearch() {
  await store.searchProjects(searchTerm.value)
}

async function clearSearch() {
  searchTerm.value = ''
  await store.searchProjects('')
}

async function handlePageChange(page) {
  await store.setProjectsPage(page)
}

async function handleSortChange({ field, order }) {
  await store.setProjectsSort(field, order)
}

async function handleViewDetails(projectId) {
  showDetailsModal.value = true
  await store.fetchProjectDetails(projectId)
}

function closeDetailsModal() {
  showDetailsModal.value = false
}

function formatDate(timestamp) {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString()
}

onMounted(async () => {
  await store.fetchProjectStatistics()
})
</script>

<style scoped>
.project-statistics {
  padding: 1rem 0;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>

