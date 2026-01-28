<template>
  <div class="tasks-monitor">
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h1>Background Tasks Monitor</h1>
            <p class="text-muted mb-0">
              Monitor cron jobs, task queue, and async processes
            </p>
          </div>
          <button 
            class="btn btn-outline-primary" 
            @click="refreshAll" 
            :disabled="isRefreshing"
          >
            <i class="fa fa-sync-alt me-2" :class="{ 'fa-spin': isRefreshing }"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingSummary && !taskSummary" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading task data...</p>
      </div>

      <!-- Main Content -->
      <template v-if="taskSummary">
        <!-- Health Status Banner -->
        <div 
          class="alert mb-4"
          :class="{
            'alert-success': healthStatus === 'healthy',
            'alert-warning': healthStatus === 'warning',
            'alert-danger': healthStatus === 'critical'
          }"
        >
          <div class="d-flex align-items-center">
            <i 
              class="fa fa-2x me-3"
              :class="{
                'fa-check-circle': healthStatus === 'healthy',
                'fa-exclamation-triangle': healthStatus === 'warning',
                'fa-times-circle': healthStatus === 'critical'
              }"
            ></i>
            <div>
              <strong>System Health: {{ healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1) }}</strong>
              <p class="mb-0 small">
                <template v-if="healthStatus === 'healthy'">
                  All background processes are running normally.
                </template>
                <template v-else-if="healthStatus === 'warning'">
                  Some tasks may be experiencing issues. Review the details below.
                </template>
                <template v-else>
                  Critical issues detected! Check stuck tasks and failure rates immediately.
                </template>
              </p>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="row mb-4">
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card h-100 summary-card">
              <div class="card-body text-center">
                <div class="stat-icon bg-secondary-subtle">
                  <i class="fa fa-clock text-secondary"></i>
                </div>
                <div class="stat-value">{{ taskSummary.statusSummary.pending }}</div>
                <div class="stat-label">Pending Tasks</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card h-100 summary-card">
              <div class="card-body text-center">
                <div class="stat-icon bg-primary-subtle">
                  <i class="fa fa-spinner text-primary"></i>
                </div>
                <div class="stat-value">{{ taskSummary.statusSummary.processing }}</div>
                <div class="stat-label">Processing</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card h-100 summary-card">
              <div class="card-body text-center">
                <div class="stat-icon bg-success-subtle">
                  <i class="fa fa-check-circle text-success"></i>
                </div>
                <div class="stat-value">{{ taskSummary.failureRates.last_24h?.completed || 0 }}</div>
                <div class="stat-label">Completed (24h)</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card h-100 summary-card">
              <div class="card-body text-center">
                <div class="stat-icon bg-danger-subtle">
                  <i class="fa fa-times-circle text-danger"></i>
                </div>
                <div class="stat-value">{{ taskSummary.failureRates.last_24h?.failed || 0 }}</div>
                <div class="stat-label">Failed (24h)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Failure Rates Row -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0 text-white">
                  <i class="fa fa-chart-line me-2"></i>
                  Failure Rates
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4 text-center mb-3 mb-md-0">
                    <div class="failure-rate-box">
                      <div class="period-label">Last 24 Hours</div>
                      <div 
                        class="rate-value"
                        :class="getFailureRateClass(taskSummary.failureRates.last_24h?.rate)"
                      >
                        {{ taskSummary.failureRates.last_24h?.rate || 0 }}%
                      </div>
                      <div class="rate-detail">
                        {{ taskSummary.failureRates.last_24h?.failed || 0 }} / 
                        {{ taskSummary.failureRates.last_24h?.total || 0 }} tasks
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4 text-center mb-3 mb-md-0">
                    <div class="failure-rate-box">
                      <div class="period-label">Last 7 Days</div>
                      <div 
                        class="rate-value"
                        :class="getFailureRateClass(taskSummary.failureRates.last_7d?.rate)"
                      >
                        {{ taskSummary.failureRates.last_7d?.rate || 0 }}%
                      </div>
                      <div class="rate-detail">
                        {{ taskSummary.failureRates.last_7d?.failed || 0 }} / 
                        {{ taskSummary.failureRates.last_7d?.total || 0 }} tasks
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4 text-center">
                    <div class="failure-rate-box">
                      <div class="period-label">Last 30 Days</div>
                      <div 
                        class="rate-value"
                        :class="getFailureRateClass(taskSummary.failureRates.last_30d?.rate)"
                      >
                        {{ taskSummary.failureRates.last_30d?.rate || 0 }}%
                      </div>
                      <div class="rate-detail">
                        {{ taskSummary.failureRates.last_30d?.failed || 0 }} / 
                        {{ taskSummary.failureRates.last_30d?.total || 0 }} tasks
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stuck Tasks Alert -->
        <div v-if="taskSummary.stuckTasks?.length > 0" class="row mb-4">
          <div class="col-12">
            <div class="card border-danger">
              <div class="card-header bg-danger text-white">
                <h5 class="card-title mb-0">
                  <i class="fa fa-exclamation-triangle me-2"></i>
                  Stuck Tasks ({{ taskSummary.stuckTasks.length }})
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted mb-3">
                  These tasks have been processing for more than 10 minutes and may be stuck.
                </p>
                <table class="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Handler</th>
                      <th>User ID</th>
                      <th>Time Stuck</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="task in taskSummary.stuckTasks" :key="task.taskId">
                      <td>{{ task.taskId }}</td>
                      <td>
                        <span class="badge bg-secondary">{{ task.handler }}</span>
                      </td>
                      <td>{{ task.userId || 'N/A' }}</td>
                      <td class="text-danger fw-bold">{{ task.minutesStuck }} min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Handler Stats Table -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0 text-white">
                  <i class="fa fa-list-alt me-2"></i>
                  Handler Breakdown
                </h5>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Handler</th>
                        <th class="text-center">Pending</th>
                        <th class="text-center">Processing</th>
                        <th class="text-center">Completed (24h)</th>
                        <th class="text-center">Failed (24h)</th>
                        <th class="text-center">Failure Rate (24h)</th>
                        <th class="text-center">Total Completed</th>
                        <th class="text-center">Total Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="handler in taskSummary.handlerStats" :key="handler.handler">
                        <td>
                          <span class="badge bg-primary">{{ handler.handler }}</span>
                        </td>
                        <td class="text-center">
                          <span v-if="handler.pending > 0" class="badge bg-secondary">
                            {{ handler.pending }}
                          </span>
                          <span v-else class="text-muted">0</span>
                        </td>
                        <td class="text-center">
                          <span v-if="handler.processing > 0" class="badge bg-info">
                            {{ handler.processing }}
                          </span>
                          <span v-else class="text-muted">0</span>
                        </td>
                        <td class="text-center text-success">{{ handler.completed24h }}</td>
                        <td class="text-center">
                          <span v-if="handler.failed24h > 0" class="text-danger fw-bold">
                            {{ handler.failed24h }}
                          </span>
                          <span v-else class="text-muted">0</span>
                        </td>
                        <td class="text-center">
                          <span 
                            class="badge"
                            :class="getFailureRateBadgeClass(handler.failureRate24h)"
                          >
                            {{ handler.failureRate24h }}%
                          </span>
                        </td>
                        <td class="text-center text-muted">{{ handler.completedTotal }}</td>
                        <td class="text-center text-muted">{{ handler.failedTotal }}</td>
                      </tr>
                      <tr v-if="!taskSummary.handlerStats?.length">
                        <td colspan="8" class="text-center text-muted py-4">
                          No handler data available
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Failures -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0 text-white">
                  <i class="fa fa-times-circle me-2"></i>
                  Recent Failures
                </h5>
                <span class="badge bg-danger">{{ recentFailures.length }}</span>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                  <table class="table table-hover mb-0">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th>Task ID</th>
                        <th>Handler</th>
                        <th>User</th>
                        <th>Error</th>
                        <th>Failed At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="failure in recentFailures" :key="failure.taskId">
                        <td>{{ failure.taskId }}</td>
                        <td>
                          <span class="badge bg-secondary">{{ failure.handler }}</span>
                        </td>
                        <td>
                          <span v-if="failure.userName">{{ failure.userName }}</span>
                          <span v-else class="text-muted">ID: {{ failure.userId || 'N/A' }}</span>
                        </td>
                        <td>
                          <span 
                            class="error-message" 
                            :title="failure.notes"
                            @click="showErrorDetails(failure)"
                          >
                            {{ truncateError(failure.notes) }}
                          </span>
                        </td>
                        <td>{{ formatDate(failure.completedOn) }}</td>
                        <td>
                          <button 
                            class="btn btn-sm btn-outline-primary"
                            @click="handleRetry(failure.taskId)"
                            :disabled="retryingTaskId === failure.taskId"
                          >
                            <i 
                              class="fa" 
                              :class="retryingTaskId === failure.taskId ? 'fa-spinner fa-spin' : 'fa-redo'"
                            ></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="!recentFailures?.length">
                        <td colspan="6" class="text-center text-muted py-4">
                          <i class="fa fa-check-circle text-success me-2"></i>
                          No recent failures
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scheduler and CIPRES Row -->
        <div class="row mb-4">
          <!-- Scheduler Status -->
          <div class="col-lg-6 mb-4 mb-lg-0">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0 text-white">
                  <i class="fa fa-clock me-2"></i>
                  Scheduler Status
                </h5>
                <span 
                  class="badge"
                  :class="schedulerStatus?.scheduler?.isRunning ? 'bg-success' : 'bg-danger'"
                >
                  {{ schedulerStatus?.scheduler?.isRunning ? 'Running' : 'Stopped' }}
                </span>
              </div>
              <div class="card-body">
                <div v-if="schedulerStatus?.scheduler">
                  <div class="mb-3">
                    <strong>Status:</strong>
                    <span 
                      class="ms-2"
                      :class="schedulerStatus.scheduler.isRunning ? 'text-success' : 'text-danger'"
                    >
                      {{ schedulerStatus.scheduler.isRunning ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <div class="mb-3">
                    <strong>Jobs:</strong>
                    <span class="ms-2">{{ schedulerStatus.scheduler.totalJobs }}</span>
                  </div>
                  
                  <h6 class="mt-3 mb-2">Scheduled Jobs</h6>
                  <div class="list-group list-group-flush">
                    <div 
                      v-for="job in schedulerStatus.scheduler.jobs" 
                      :key="job.name"
                      class="list-group-item d-flex justify-content-between align-items-center px-0"
                    >
                      <div>
                        <span class="fw-medium">{{ formatJobName(job.name) }}</span>
                        <small class="text-muted d-block">{{ getJobDescription(job.name) }}</small>
                      </div>
                      <button 
                        class="btn btn-sm btn-outline-secondary"
                        @click="handleTriggerJob(job.name)"
                        :disabled="triggeringJob === job.name"
                      >
                        <i 
                          class="fa"
                          :class="triggeringJob === job.name ? 'fa-spinner fa-spin' : 'fa-play'"
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center text-muted py-3">
                  <i class="fa fa-info-circle me-2"></i>
                  Loading scheduler status...
                </div>
              </div>
            </div>
          </div>

          <!-- CIPRES Status -->
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0 text-white">
                  <i class="fa fa-server me-2"></i>
                  CIPRES Jobs
                </h5>
                <span class="badge bg-info">
                  {{ cipresStatus?.activeJobs?.length || 0 }} active
                </span>
              </div>
              <div class="card-body">
                <div v-if="cipresStatus">
                  <!-- Status Summary -->
                  <div v-if="cipresStatus.statusSummary?.length" class="mb-3">
                    <h6 class="mb-2">Status Distribution</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <span 
                        v-for="status in cipresStatus.statusSummary" 
                        :key="status.status"
                        class="badge"
                        :class="getCipresStatusClass(status.status)"
                      >
                        {{ status.status }}: {{ status.count }}
                      </span>
                    </div>
                  </div>

                  <!-- Active Jobs -->
                  <div v-if="cipresStatus.activeJobs?.length">
                    <h6 class="mb-2">Active Jobs</h6>
                    <div class="list-group list-group-flush" style="max-height: 200px; overflow-y: auto;">
                      <div 
                        v-for="job in cipresStatus.activeJobs" 
                        :key="job.requestId"
                        class="list-group-item px-0"
                      >
                        <div class="d-flex justify-content-between">
                          <div>
                            <strong>{{ job.jobName || job.cipresJobId }}</strong>
                            <small class="text-muted d-block">
                              Matrix: {{ job.matrixTitle || job.matrixId }}
                            </small>
                          </div>
                          <span 
                            class="badge"
                            :class="getCipresStatusClass(job.cipresStatus)"
                          >
                            {{ job.cipresStatus }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center text-muted py-3">
                    <i class="fa fa-check-circle text-success me-2"></i>
                    No active CIPRES jobs
                  </div>
                </div>
                <div v-else class="text-center text-muted py-3">
                  <i class="fa fa-info-circle me-2"></i>
                  Loading CIPRES status...
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Error Details Modal -->
    <div
      v-if="showErrorModal"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      @click.self="showErrorModal = false"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Task Error Details - #{{ selectedError?.taskId }}
            </h5>
            <button type="button" class="btn-close" @click="showErrorModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedError">
              <div class="row mb-3">
                <div class="col-md-6">
                  <strong>Handler:</strong> {{ selectedError.handler }}
                </div>
                <div class="col-md-6">
                  <strong>Error Code:</strong> {{ selectedError.errorCode }}
                </div>
              </div>
              <div class="mb-3">
                <strong>Parameters:</strong>
                <pre class="bg-light p-2 rounded mt-1">{{ JSON.stringify(selectedError.parameters, null, 2) }}</pre>
              </div>
              <div>
                <strong>Error Message:</strong>
                <pre class="bg-danger-subtle p-2 rounded mt-1 text-danger">{{ selectedError.notes }}</pre>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showErrorModal = false">
              Close
            </button>
            <button 
              type="button" 
              class="btn btn-primary"
              @click="handleRetry(selectedError?.taskId); showErrorModal = false"
            >
              <i class="fa fa-redo me-2"></i>Retry Task
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showErrorModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminTasksStore } from '@/stores/AdminTasksStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const store = useAdminTasksStore()
const { showSuccess, showError } = useNotifications()

const isRefreshing = ref(false)
const retryingTaskId = ref(null)
const triggeringJob = ref(null)
const showErrorModal = ref(false)
const selectedError = ref(null)

// Computed from store
const taskSummary = computed(() => store.taskSummary)
const recentFailures = computed(() => store.recentFailures)
const cipresStatus = computed(() => store.cipresStatus)
const schedulerStatus = computed(() => store.schedulerStatus)
const healthStatus = computed(() => store.healthStatus)
const isLoadingSummary = computed(() => store.isLoadingSummary)

onMounted(async () => {
  try {
    await store.fetchAll()
  } catch (error) {
    showError('Failed to load task data')
  }
})

async function refreshAll() {
  isRefreshing.value = true
  try {
    await store.fetchAll()
    showSuccess('Data refreshed')
  } catch (error) {
    showError('Failed to refresh data')
  } finally {
    isRefreshing.value = false
  }
}

async function handleRetry(taskId) {
  retryingTaskId.value = taskId
  try {
    const result = await store.retryTask(taskId)
    if (result.success) {
      showSuccess(result.message)
    } else {
      showError(result.message)
    }
  } finally {
    retryingTaskId.value = null
  }
}

async function handleTriggerJob(jobName) {
  triggeringJob.value = jobName
  try {
    const result = await store.triggerJob(jobName)
    if (result.success) {
      showSuccess(result.message)
    } else {
      showError(result.message)
    }
  } finally {
    triggeringJob.value = null
  }
}

function showErrorDetails(failure) {
  selectedError.value = failure
  showErrorModal.value = true
}

function getFailureRateClass(rate) {
  if (rate > 20) return 'text-danger'
  if (rate > 5) return 'text-warning'
  return 'text-success'
}

function getFailureRateBadgeClass(rate) {
  if (rate > 20) return 'bg-danger'
  if (rate > 5) return 'bg-warning text-dark'
  return 'bg-success'
}

function getCipresStatusClass(status) {
  if (!status) return 'bg-secondary'
  const upperStatus = status.toUpperCase()
  if (upperStatus === 'COMPLETED') return 'bg-success'
  if (upperStatus === 'FAILED' || upperStatus === 'CANCELLED') return 'bg-danger'
  if (upperStatus.includes('RUNNING') || upperStatus.includes('PROCESSING')) return 'bg-primary'
  if (upperStatus.includes('QUEUE') || upperStatus.includes('SUBMITTED')) return 'bg-info'
  return 'bg-secondary'
}

function formatJobName(name) {
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function getJobDescription(name) {
  const descriptions = {
    'cipres-sync': 'Syncs CIPRES job status every 5 minutes',
    'task-queue': 'Processes pending tasks every minute',
    'stats-cache': 'Updates project stats cache every 30 minutes',
  }
  return descriptions[name] || ''
}

function truncateError(error) {
  if (!error) return 'No error message'
  return error.length > 80 ? error.substring(0, 80) + '...' : error
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}
</script>

<style scoped>
.summary-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.stat-icon i {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.failure-rate-box {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.period-label {
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.rate-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.rate-detail {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.error-message {
  cursor: pointer;
  color: #dc3545;
  font-family: monospace;
  font-size: 0.85rem;
}

.error-message:hover {
  text-decoration: underline;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.card-title {
  color: #495057;
}

.sticky-top {
  background: white;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.85rem;
  margin: 0;
}
</style>

