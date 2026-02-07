<template>
  <div class="admin-statistics">
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h1>Site Statistics</h1>
          <p class="text-muted">Overall site usage metrics and analytics</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingSiteStats && !siteTotals" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading statistics...</p>
      </div>

      <!-- All-Time Totals -->
      <div v-if="siteTotals" class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-chart-bar me-2"></i>
                All-Time Totals
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Projects</div>
                    <div class="stat-value text-primary">{{ siteTotals.numProjects || 0 }}</div>
                    <small class="text-muted">
                      {{ siteTotals.numPublishedProjects || 0 }} published / 
                      {{ siteTotals.numUnpublishedProjects || 0 }} unpublished
                    </small>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value text-success">{{ siteTotals.numUsers || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Matrices</div>
                    <div class="stat-value text-info">{{ siteTotals.numMatrices || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Media</div>
                    <div class="stat-value text-warning">{{ siteTotals.numMedia || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Taxa</div>
                    <div class="stat-value">{{ siteTotals.numTaxa || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Characters</div>
                    <div class="stat-value">{{ siteTotals.numCharacters || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Cells</div>
                    <div class="stat-value">{{ siteTotals.numCells || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Total Specimens</div>
                    <div class="stat-value">{{ siteTotals.numSpecimens || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-calendar me-2"></i>
                Select Time Period
              </h5>
            </div>
            <div class="card-body">
              <!-- Preset Date Range Buttons -->
              <div class="btn-group flex-wrap mb-3" role="group">
                <button 
                  v-for="range in availableDateRanges" 
                  :key="range.value"
                  type="button" 
                  class="btn"
                  :class="dateRange === range.value && !isCustomRange ? 'btn-primary' : 'btn-outline-primary'"
                  @click="handleDateRangeChange(range.value)"
                >
                  {{ range.label }}
                </button>
                <button 
                  type="button" 
                  class="btn"
                  :class="isCustomRange ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="showCustomRangePicker = !showCustomRangePicker"
                >
                  <i class="fa fa-calendar-alt me-1"></i>
                  Custom Range
                </button>
              </div>

              <!-- Custom Date Range Picker -->
              <div v-if="showCustomRangePicker" class="custom-range-picker p-3 bg-light rounded">
                <div class="alert alert-warning mb-3">
                  <i class="fa fa-exclamation-triangle me-2"></i>
                  <strong>Note:</strong> Custom date ranges require a database query and may take a few seconds to load.
                  Maximum range is 1 year to prevent timeouts.
                </div>
                <div class="row g-3 align-items-end">
                  <div class="col-md-4">
                    <label class="form-label">Start Date</label>
                    <input 
                      type="date" 
                      v-model="customStartDate" 
                      class="form-control"
                      :max="customEndDate || todayDate"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">End Date</label>
                    <input 
                      type="date" 
                      v-model="customEndDate" 
                      class="form-control"
                      :min="customStartDate"
                      :max="todayDate"
                    />
                  </div>
                  <div class="col-md-4">
                    <button 
                      class="btn btn-primary w-100"
                      @click="applyCustomRange"
                      :disabled="!canApplyCustomRange || isLoadingCustomRange"
                    >
                      <span v-if="isLoadingCustomRange">
                        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                        Loading...
                      </span>
                      <span v-else>
                        <i class="fa fa-check me-2"></i>
                        Apply Custom Range
                      </span>
                    </button>
                  </div>
                </div>
                <div v-if="customRangeError" class="text-danger mt-2">
                  <i class="fa fa-exclamation-circle me-1"></i>
                  {{ customRangeError }}
                </div>
                <div v-if="customStartDate && customEndDate && !customRangeError" class="text-muted mt-2">
                  <i class="fa fa-info-circle me-1"></i>
                  Range: {{ formatDateForDisplay(customStartDate) }} to {{ formatDateForDisplay(customEndDate) }}
                  ({{ daysBetween }} days)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Statistics -->
      <div v-if="siteDateRangeTotals" class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-filter me-2"></i>
                Statistics for {{ selectedPeriodLabel }}
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Projects Created</div>
                    <div class="stat-value text-primary">{{ siteDateRangeTotals.projectsCreated || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Projects Published</div>
                    <div class="stat-value text-success">{{ siteDateRangeTotals.projectsPublished || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Users Registered</div>
                    <div class="stat-value text-info">{{ siteDateRangeTotals.usersRegistered || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                  <div class="stat-box">
                    <div class="stat-label">Media Uploaded</div>
                    <div class="stat-value text-warning">{{ siteDateRangeTotals.mediaUploaded || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions with Period Label -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">
                <i class="fa fa-search me-2"></i>
                View Detailed Records for {{ selectedPeriodLabel }}
              </h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-primary" @click="showRegistrationDetails">
                  <i class="fa fa-user-plus me-2"></i>
                  Registrations
                </button>
                <button class="btn btn-outline-success" @click="showProjectPubDetails">
                  <i class="fa fa-book me-2"></i>
                  Publications
                </button>
                <button class="btn btn-outline-info" @click="showUploadDetails">
                  <i class="fa fa-upload me-2"></i>
                  Media Uploads
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Notice -->
      <div class="row">
        <div class="col-12">
          <div class="alert alert-info">
            <i class="fa fa-info-circle me-2"></i>
            <strong>Note:</strong> Login tracking, download tracking, and geographic statistics 
            require additional database tables that are not currently configured. 
            Only basic project, user, and content statistics are available.
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showDetailModal"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      @click.self="closeDetailModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ detailModalTitle }}</h5>
            <button type="button" class="btn-close" @click="closeDetailModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="isLoadingDetail" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div v-else-if="detailModalData" class="detail-content">
              <!-- Registrations -->
              <div v-if="detailModalData.registrations">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="reg in detailModalData.registrations" :key="reg.userId">
                      <td>{{ reg.userId }}</td>
                      <td>{{ reg.name }}</td>
                      <td>{{ reg.email }}</td>
                      <td>{{ formatDate(reg.registeredOn) }}</td>
                    </tr>
                    <tr v-if="detailModalData.registrations.length === 0">
                      <td colspan="4" class="text-center text-muted">No registrations found for {{ selectedPeriodLabel }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Publications -->
              <div v-else-if="detailModalData.published || detailModalData.created">
                <h6>Projects Published ({{ selectedPeriodLabel }})</h6>
                <table class="table table-sm mb-4">
                  <thead>
                    <tr>
                      <th>Project ID</th>
                      <th>Name</th>
                      <th>Admin</th>
                      <th>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="proj in detailModalData.published" :key="proj.projectId">
                      <td>{{ proj.projectId }}</td>
                      <td>{{ proj.name }}</td>
                      <td>{{ proj.admin }}</td>
                      <td>{{ formatDate(proj.publishedOn) }}</td>
                    </tr>
                    <tr v-if="!detailModalData.published?.length">
                      <td colspan="4" class="text-center text-muted">No publications found</td>
                    </tr>
                  </tbody>
                </table>
                
                <h6>Projects Created ({{ selectedPeriodLabel }})</h6>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Project ID</th>
                      <th>Name</th>
                      <th>Admin</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="proj in detailModalData.created" :key="proj.projectId">
                      <td>{{ proj.projectId }}</td>
                      <td>{{ proj.name }}</td>
                      <td>{{ proj.admin }}</td>
                      <td>{{ formatDate(proj.createdOn) }}</td>
                    </tr>
                    <tr v-if="!detailModalData.created?.length">
                      <td colspan="4" class="text-center text-muted">No projects created</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Uploads -->
              <div v-else-if="detailModalData.uploads">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Media ID</th>
                      <th>Project</th>
                      <th>Uploaded By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="upload in detailModalData.uploads" :key="upload.mediaId">
                      <td>{{ upload.mediaId }}</td>
                      <td>{{ upload.projectName || upload.projectId }}</td>
                      <td>{{ upload.uploadedBy }}</td>
                      <td>{{ formatDate(upload.uploadedOn) }}</td>
                    </tr>
                    <tr v-if="detailModalData.uploads.length === 0">
                      <td colspan="4" class="text-center text-muted">No uploads found for {{ selectedPeriodLabel }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Message (for unavailable features) -->
              <div v-else-if="detailModalData.message" class="alert alert-warning">
                {{ detailModalData.message }}
              </div>
              
              <!-- Raw JSON fallback -->
              <pre v-else class="bg-light p-3 rounded">{{ JSON.stringify(detailModalData, null, 2) }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showDetailModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAdminStatisticsStore } from '@/stores/AdminStatisticsStore.js'
import { apiService } from '@/services/apiService.js'

const store = useAdminStatisticsStore()

const dateRange = ref('today')
const showDetailModal = ref(false)
const detailModalTitle = ref('')
const detailModalData = ref(null)

// Custom range state
const showCustomRangePicker = ref(false)
const customStartDate = ref('')
const customEndDate = ref('')
const isCustomRange = ref(false)
const isLoadingCustomRange = ref(false)
const customRangeError = ref('')
const customRangeLabel = ref('')

// Available date range options (presets that are pre-cached)
const availableDateRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last week', label: 'Last Week' },
  { value: 'this month', label: 'This Month' },
  { value: 'last month', label: 'Last Month' },
  { value: 'this year', label: 'This Year' },
  { value: 'last year', label: 'Last Year' }
]

// Get today's date for max date validation
const todayDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Calculate days between custom dates
const daysBetween = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return 0
  const start = new Date(customStartDate.value)
  const end = new Date(customEndDate.value)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
})

// Validate custom range
const canApplyCustomRange = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return false
  if (daysBetween.value > 366) {
    customRangeError.value = 'Date range cannot exceed 1 year (366 days) to prevent timeouts.'
    return false
  }
  customRangeError.value = ''
  return true
})

// Get the display label for the selected period
const selectedPeriodLabel = computed(() => {
  if (isCustomRange.value && customRangeLabel.value) {
    return customRangeLabel.value
  }
  const found = availableDateRanges.find(r => r.value === dateRange.value)
  return found ? found.label : dateRange.value
})

const siteTotals = computed(() => store.siteTotals)
const siteDateRangeTotals = computed(() => store.siteDateRangeTotals)
const isLoadingSiteStats = computed(() => store.isLoadingSiteStats)
const isLoadingDetail = computed(() => store.isLoadingDetail)

onMounted(async () => {
  try {
    // Fetch ALL date range stats at once for instant switching
    await store.fetchAllDateRangeStats()
  } catch (error) {
    console.error('Error loading site statistics:', error)
  }
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Instant switch for preset ranges - no network request needed  
function handleDateRangeChange(newRange) {
  dateRange.value = newRange
  isCustomRange.value = false
  showCustomRangePicker.value = false
  
  // Use cached data for instant switching
  const cachedStats = store.allDateRangeStats
  if (cachedStats && cachedStats[newRange]) {
    store.$patch({
      siteDateRangeTotals: cachedStats[newRange],
      currentDateRange: newRange
    })
  }
}

// Apply custom date range (requires API call)
async function applyCustomRange() {
  if (!canApplyCustomRange.value) return
  
  isLoadingCustomRange.value = true
  customRangeError.value = ''
  
  try {
    // Convert dates to Unix timestamps
    const startTimestamp = Math.floor(new Date(customStartDate.value + 'T00:00:00').getTime() / 1000)
    const endTimestamp = Math.floor(new Date(customEndDate.value + 'T23:59:59').getTime() / 1000)
    
    // Fetch custom range stats from API
    const response = await apiService.get('/admin/statistics/site', {
      params: { 
        daterange: `${customStartDate.value} - ${customEndDate.value}`,
        start: startTimestamp,
        end: endTimestamp
      }
    })
    const data = await response.json()
    
    if (data.success) {
      isCustomRange.value = true
      customRangeLabel.value = `${formatDateForDisplay(customStartDate.value)} – ${formatDateForDisplay(customEndDate.value)}`
      
      store.$patch({
        siteDateRangeTotals: data.data.dateRangeTotals,
        currentDateRange: customRangeLabel.value
      })
      
      showCustomRangePicker.value = false
    } else {
      customRangeError.value = data.message || 'Failed to fetch custom range statistics'
    }
  } catch (error) {
    console.error('Error fetching custom range:', error)
    customRangeError.value = 'Failed to load custom range. Please try a smaller date range.'
  } finally {
    isLoadingCustomRange.value = false
  }
}

// Get the date range parameter for detail requests
// Returns either the preset string or { start, end } timestamps for custom range
function getDateRangeParam() {
  if (isCustomRange.value && customStartDate.value && customEndDate.value) {
    return {
      start: Math.floor(new Date(customStartDate.value + 'T00:00:00').getTime() / 1000),
      end: Math.floor(new Date(customEndDate.value + 'T23:59:59').getTime() / 1000)
    }
  }
  return dateRange.value
}

async function showRegistrationDetails() {
  detailModalTitle.value = `Registrations – ${selectedPeriodLabel.value}`
  showDetailModal.value = true
  detailModalData.value = await store.fetchRegistrationInfo(getDateRangeParam())
}

async function showProjectPubDetails() {
  detailModalTitle.value = `Project Activity – ${selectedPeriodLabel.value}`
  showDetailModal.value = true
  detailModalData.value = await store.fetchProjectPubInfo(getDateRangeParam())
}

async function showUploadDetails() {
  detailModalTitle.value = `Media Uploads – ${selectedPeriodLabel.value}`
  showDetailModal.value = true
  detailModalData.value = await store.fetchUploadInfo(getDateRangeParam())
}

function closeDetailModal() {
  showDetailModal.value = false
  detailModalData.value = null
}

function handleEscape(event) {
  if (event.key === 'Escape' && showDetailModal.value) {
    closeDetailModal()
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function formatDateForDisplay(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.stat-box {
  padding: 1rem;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #212529;
}

.card-title {
  color: #495057;
}

.detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.custom-range-picker {
  border: 1px solid #dee2e6;
}

.btn-group .btn {
  margin-bottom: 0.25rem;
}
</style>
