import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/apiService.js'

export const useAdminTasksStore = defineStore('adminTasks', () => {
  // State
  const taskSummary = ref(null)
  const taskHistory = ref([])
  const historyPagination = ref({
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0,
  })
  const recentFailures = ref([])
  const cipresStatus = ref(null)
  const schedulerStatus = ref(null)
  const handlers = ref([])

  // Loading states
  const isLoadingSummary = ref(false)
  const isLoadingHistory = ref(false)
  const isLoadingFailures = ref(false)
  const isLoadingCipres = ref(false)
  const isLoadingScheduler = ref(false)
  const error = ref(null)

  // Computed: Overall health status
  const healthStatus = computed(() => {
    if (!taskSummary.value) return 'unknown'

    const { failureRates, stuckTasks, statusSummary } = taskSummary.value

    // Critical: more than 20% failure rate in last 24h or stuck tasks
    if (
      (failureRates?.last_24h?.rate > 20) ||
      (stuckTasks?.length > 0)
    ) {
      return 'critical'
    }

    // Warning: more than 5% failure rate or processing tasks > pending
    if (
      (failureRates?.last_24h?.rate > 5) ||
      (statusSummary?.processing > 10)
    ) {
      return 'warning'
    }

    return 'healthy'
  })

  // Computed: Quick stats for dashboard card
  const quickStats = computed(() => {
    if (!taskSummary.value) return null

    const { statusSummary, failureRates, stuckTasks } = taskSummary.value
    return {
      pending: statusSummary?.pending || 0,
      processing: statusSummary?.processing || 0,
      completed24h: failureRates?.last_24h?.completed || 0,
      failed24h: failureRates?.last_24h?.failed || 0,
      failureRate24h: failureRates?.last_24h?.rate || 0,
      stuckCount: stuckTasks?.length || 0,
    }
  })

  // Actions
  async function fetchTaskSummary() {
    isLoadingSummary.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/tasks/summary')
      const data = await response.json()
      if (data.success) {
        taskSummary.value = data.data
      } else {
        throw new Error(data.message || 'Failed to fetch task summary')
      }
    } catch (err) {
      console.error('Error fetching task summary:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingSummary.value = false
    }
  }

  async function fetchTaskHistory(options = {}) {
    isLoadingHistory.value = true
    error.value = null
    try {
      const params = {
        page: options.page || historyPagination.value.page,
        limit: options.limit || historyPagination.value.limit,
        status: options.status,
        handler: options.handler,
        search: options.search,
      }

      // Remove undefined params
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })

      const response = await apiService.get('/admin/tasks/history', { params })
      const data = await response.json()
      if (data.success) {
        taskHistory.value = data.data.tasks
        historyPagination.value = data.data.pagination
      } else {
        throw new Error(data.message || 'Failed to fetch task history')
      }
    } catch (err) {
      console.error('Error fetching task history:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function fetchRecentFailures(limit = 20) {
    isLoadingFailures.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/tasks/failures', {
        params: { limit },
      })
      const data = await response.json()
      if (data.success) {
        recentFailures.value = data.data.failures
      } else {
        throw new Error(data.message || 'Failed to fetch recent failures')
      }
    } catch (err) {
      console.error('Error fetching recent failures:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingFailures.value = false
    }
  }

  async function fetchCipresStatus() {
    isLoadingCipres.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/tasks/cipres')
      const data = await response.json()
      if (data.success) {
        cipresStatus.value = data.data
      } else {
        throw new Error(data.message || 'Failed to fetch CIPRES status')
      }
    } catch (err) {
      console.error('Error fetching CIPRES status:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingCipres.value = false
    }
  }

  async function fetchSchedulerStatus() {
    isLoadingScheduler.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/tasks/scheduler')
      const data = await response.json()
      if (data.success) {
        schedulerStatus.value = data.data
      } else {
        throw new Error(data.message || 'Failed to fetch scheduler status')
      }
    } catch (err) {
      console.error('Error fetching scheduler status:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingScheduler.value = false
    }
  }

  async function fetchHandlers() {
    try {
      const response = await apiService.get('/admin/tasks/handlers')
      const data = await response.json()
      if (data.success) {
        handlers.value = data.data.handlers
      }
    } catch (err) {
      console.error('Error fetching handlers:', err)
    }
  }

  async function retryTask(taskId) {
    try {
      const response = await apiService.post(`/admin/tasks/retry/${taskId}`)
      const data = await response.json()
      if (data.success) {
        // Refresh failures and summary after retry
        await Promise.all([fetchRecentFailures(), fetchTaskSummary()])
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to retry task')
      }
    } catch (err) {
      console.error('Error retrying task:', err)
      return { success: false, message: err.message }
    }
  }

  async function triggerJob(jobName) {
    try {
      const response = await apiService.post(`/admin/tasks/trigger/${jobName}`)
      const data = await response.json()
      if (data.success) {
        // Refresh scheduler status after trigger
        await fetchSchedulerStatus()
        return { success: true, message: data.message }
      } else {
        throw new Error(data.message || 'Failed to trigger job')
      }
    } catch (err) {
      console.error('Error triggering job:', err)
      return { success: false, message: err.message }
    }
  }

  async function fetchAll() {
    await Promise.all([
      fetchTaskSummary(),
      fetchRecentFailures(),
      fetchCipresStatus(),
      fetchSchedulerStatus(),
      fetchHandlers(),
    ])
  }

  function reset() {
    taskSummary.value = null
    taskHistory.value = []
    historyPagination.value = {
      page: 1,
      limit: 50,
      totalItems: 0,
      totalPages: 0,
    }
    recentFailures.value = []
    cipresStatus.value = null
    schedulerStatus.value = null
    handlers.value = []
    isLoadingSummary.value = false
    isLoadingHistory.value = false
    isLoadingFailures.value = false
    isLoadingCipres.value = false
    isLoadingScheduler.value = false
    error.value = null
  }

  return {
    // State
    taskSummary,
    taskHistory,
    historyPagination,
    recentFailures,
    cipresStatus,
    schedulerStatus,
    handlers,
    isLoadingSummary,
    isLoadingHistory,
    isLoadingFailures,
    isLoadingCipres,
    isLoadingScheduler,
    error,

    // Computed
    healthStatus,
    quickStats,

    // Actions
    fetchTaskSummary,
    fetchTaskHistory,
    fetchRecentFailures,
    fetchCipresStatus,
    fetchSchedulerStatus,
    fetchHandlers,
    retryTask,
    triggerJob,
    fetchAll,
    reset,
  }
})

