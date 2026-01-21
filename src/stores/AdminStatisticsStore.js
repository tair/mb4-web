import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/apiService.js'

export const useAdminStatisticsStore = defineStore('adminStatistics', () => {
  // Site Statistics State
  const siteTotals = ref(null)
  const siteDateRangeTotals = ref(null)
  const allDateRangeStats = ref(null) // Cache for all date range stats
  const siteMemberProjectStats = ref(null)
  const siteLoginSessionStats = ref(null)
  const siteDownloadStats = ref(null)
  const siteUploadStats = ref(null)
  const currentDateRange = ref('today')
  
  // Project Statistics State
  const projectStatsTotals = ref(null)
  const projectsList = ref([])
  const projectsPagination = ref({
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0
  })
  const projectsSort = ref({ field: 'project_id', order: 'desc' })
  const projectsSearch = ref('')
  const selectedProjectDetails = ref(null)
  
  // Detail Views State
  const loginInfo = ref(null)
  const downloadInfo = ref(null)
  const uploadInfo = ref(null)
  const registrationInfo = ref(null)
  const projectPubInfo = ref(null)
  const locationInfo = ref(null)
  
  // Loading States
  const isLoadingSiteStats = ref(false)
  const isLoadingProjectStats = ref(false)
  const isLoadingDetail = ref(false)
  const error = ref(null)
  
  // Actions - Site Statistics
  
  /**
   * Fetch all-time site totals
   */
  async function fetchSiteTotals() {
    isLoadingSiteStats.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/statistics/site/totals')
      const data = await response.json()
      if (data.success) {
        siteTotals.value = data.data
      } else {
        throw new Error(data.message || 'Failed to fetch site totals')
      }
    } catch (err) {
      console.error('Error fetching site totals:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingSiteStats.value = false
    }
  }
  
  /**
   * Fetch ALL date range statistics at once and cache them
   * This is the preferred method - loads all ranges for instant switching
   */
  async function fetchAllDateRangeStats() {
    isLoadingSiteStats.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/statistics/site/all-ranges')
      const data = await response.json()
      if (data.success) {
        siteTotals.value = data.data.totals
        allDateRangeStats.value = data.data.dateRanges
        // Set the current date range stats
        if (data.data.dateRanges[currentDateRange.value]) {
          siteDateRangeTotals.value = data.data.dateRanges[currentDateRange.value]
        }
      } else {
        throw new Error(data.message || 'Failed to fetch date range statistics')
      }
    } catch (err) {
      console.error('Error fetching all date range stats:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingSiteStats.value = false
    }
  }
  
  /**
   * Switch to a different date range (uses cached data if available)
   */
  function setDateRange(dateRange) {
    currentDateRange.value = dateRange
    // If we have cached stats, use them instantly
    if (allDateRangeStats.value && allDateRangeStats.value[dateRange]) {
      siteDateRangeTotals.value = allDateRangeStats.value[dateRange]
    }
  }
  
  /**
   * Fetch site statistics for a date range (legacy method, kept for compatibility)
   */
  async function fetchSiteStatistics(dateRange = 'today') {
    // If we already have all ranges cached, just switch
    if (allDateRangeStats.value && allDateRangeStats.value[dateRange]) {
      setDateRange(dateRange)
      return
    }
    
    isLoadingSiteStats.value = true
    error.value = null
    currentDateRange.value = dateRange
    try {
      const response = await apiService.get('/admin/statistics/site', {
        params: { daterange: dateRange }
      })
      const data = await response.json()
      if (data.success) {
        siteDateRangeTotals.value = data.data.dateRangeTotals
        siteMemberProjectStats.value = data.data.memberProjectStats
        siteLoginSessionStats.value = data.data.loginSessionStats
        siteDownloadStats.value = data.data.downloadStats
        siteUploadStats.value = data.data.uploadStats
      } else {
        throw new Error(data.message || 'Failed to fetch site statistics')
      }
    } catch (err) {
      console.error('Error fetching site statistics:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingSiteStats.value = false
    }
  }
  
  /**
   * Fetch detailed login information
   */
  async function fetchLoginInfo(dateRange = 'today') {
    isLoadingDetail.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/statistics/site/login-info', {
        params: { daterange: dateRange }
      })
      const data = await response.json()
      if (data.success) {
        loginInfo.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch login info')
      }
    } catch (err) {
      console.error('Error fetching login info:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  /**
   * Fetch detailed download information
   */
  async function fetchDownloadInfo(dateRange = 'today', downloadType = null) {
    isLoadingDetail.value = true
    error.value = null
    try {
      const params = { daterange: dateRange }
      if (downloadType) {
        params.download_type = downloadType
      }
      const response = await apiService.get('/admin/statistics/site/download-info', {
        params
      })
      const data = await response.json()
      if (data.success) {
        downloadInfo.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch download info')
      }
    } catch (err) {
      console.error('Error fetching download info:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  /**
   * Fetch detailed upload information
   * @param {string|Object} dateRange - Natural language string or { start, end } timestamps
   * @param {string} uploadType - Optional upload type filter
   */
  async function fetchUploadInfo(dateRange = 'today', uploadType = null) {
    isLoadingDetail.value = true
    error.value = null
    try {
      const params = typeof dateRange === 'object' && dateRange.start && dateRange.end
        ? { start: dateRange.start, end: dateRange.end }
        : { daterange: dateRange }
      
      if (uploadType) {
        params.upload_type = uploadType
      }
      const response = await apiService.get('/admin/statistics/site/upload-info', { params })
      const data = await response.json()
      if (data.success) {
        uploadInfo.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch upload info')
      }
    } catch (err) {
      console.error('Error fetching upload info:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  /**
   * Fetch registration information
   * @param {string|Object} dateRange - Natural language string or { start, end } timestamps
   */
  async function fetchRegistrationInfo(dateRange = 'today') {
    isLoadingDetail.value = true
    error.value = null
    try {
      const params = typeof dateRange === 'object' && dateRange.start && dateRange.end
        ? { start: dateRange.start, end: dateRange.end }
        : { daterange: dateRange }
      
      const response = await apiService.get('/admin/statistics/site/registration-info', { params })
      const data = await response.json()
      if (data.success) {
        registrationInfo.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch registration info')
      }
    } catch (err) {
      console.error('Error fetching registration info:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  /**
   * Fetch project publication information
   * @param {string|Object} dateRange - Natural language string or { start, end } timestamps
   */
  async function fetchProjectPubInfo(dateRange = 'today') {
    isLoadingDetail.value = true
    error.value = null
    try {
      const params = typeof dateRange === 'object' && dateRange.start && dateRange.end
        ? { start: dateRange.start, end: dateRange.end }
        : { daterange: dateRange }
      
      const response = await apiService.get('/admin/statistics/site/project-pub-info', { params })
      const data = await response.json()
      if (data.success) {
        projectPubInfo.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch project publication info')
      }
    } catch (err) {
      console.error('Error fetching project publication info:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  /**
   * Fetch location information
   */
  async function fetchLocationInfo(dateRange = 'today') {
    isLoadingDetail.value = true
    error.value = null
    try {
      const response = await apiService.get('/admin/statistics/site/location-info', {
        params: { daterange: dateRange }
      })
      const data = await response.json()
      if (data.success) {
        locationInfo.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch location info')
      }
    } catch (err) {
      console.error('Error fetching location info:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  // Actions - Project Statistics
  
  /**
   * Fetch project statistics with pagination
   * @param {Object} options - Pagination and filter options
   * @param {number} options.page - Page number (default 1)
   * @param {number} options.limit - Items per page (default 50)
   * @param {string} options.sort - Sort field
   * @param {string} options.order - Sort order ('asc' or 'desc')
   * @param {string} options.search - Search term
   */
  async function fetchProjectStatistics(options = {}) {
    isLoadingProjectStats.value = true
    error.value = null
    
    const page = options.page || projectsPagination.value.page
    const limit = options.limit || projectsPagination.value.limit
    const sort = options.sort || projectsSort.value.field
    const order = options.order || projectsSort.value.order
    const search = options.search !== undefined ? options.search : projectsSearch.value
    
    try {
      const response = await apiService.get('/admin/statistics/projects', {
        params: { page, limit, sort, order, search }
      })
      const data = await response.json()
      if (data.success) {
        projectStatsTotals.value = data.data.totals
        projectsList.value = data.data.projects
        projectsPagination.value = data.data.pagination
        projectsSort.value = { field: sort, order }
        projectsSearch.value = search
      } else {
        throw new Error(data.message || 'Failed to fetch project statistics')
      }
    } catch (err) {
      console.error('Error fetching project statistics:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingProjectStats.value = false
    }
  }
  
  /**
   * Fetch detailed stats for a single project
   * @param {number} projectId - The project ID
   */
  async function fetchProjectDetails(projectId) {
    isLoadingDetail.value = true
    error.value = null
    try {
      const response = await apiService.get(`/admin/statistics/projects/${projectId}`)
      const data = await response.json()
      if (data.success) {
        selectedProjectDetails.value = data.data
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch project details')
      }
    } catch (err) {
      console.error('Error fetching project details:', err)
      error.value = err.message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }
  
  /**
   * Change page for project list
   */
  async function setProjectsPage(page) {
    return fetchProjectStatistics({ page })
  }
  
  /**
   * Change sort for project list
   */
  async function setProjectsSort(field, order = 'desc') {
    return fetchProjectStatistics({ page: 1, sort: field, order })
  }
  
  /**
   * Search projects
   */
  async function searchProjects(search) {
    return fetchProjectStatistics({ page: 1, search })
  }
  
  /**
   * Reset store state
   */
  function reset() {
    siteTotals.value = null
    siteDateRangeTotals.value = null
    allDateRangeStats.value = null
    siteMemberProjectStats.value = null
    siteLoginSessionStats.value = null
    siteDownloadStats.value = null
    siteUploadStats.value = null
    currentDateRange.value = 'today'
    projectStatsTotals.value = null
    projectsList.value = []
    projectsPagination.value = { page: 1, limit: 50, totalItems: 0, totalPages: 0 }
    projectsSort.value = { field: 'project_id', order: 'desc' }
    projectsSearch.value = ''
    selectedProjectDetails.value = null
    loginInfo.value = null
    downloadInfo.value = null
    uploadInfo.value = null
    registrationInfo.value = null
    projectPubInfo.value = null
    locationInfo.value = null
    isLoadingSiteStats.value = false
    isLoadingProjectStats.value = false
    isLoadingDetail.value = false
    error.value = null
  }
  
  return {
    // State
    siteTotals,
    siteDateRangeTotals,
    allDateRangeStats,
    siteMemberProjectStats,
    siteLoginSessionStats,
    siteDownloadStats,
    siteUploadStats,
    currentDateRange,
    projectStatsTotals,
    projectsList,
    projectsPagination,
    projectsSort,
    projectsSearch,
    selectedProjectDetails,
    loginInfo,
    downloadInfo,
    uploadInfo,
    registrationInfo,
    projectPubInfo,
    locationInfo,
    isLoadingSiteStats,
    isLoadingProjectStats,
    isLoadingDetail,
    error,
    
    // Actions
    fetchSiteTotals,
    fetchAllDateRangeStats,
    setDateRange,
    fetchSiteStatistics,
    fetchLoginInfo,
    fetchDownloadInfo,
    fetchUploadInfo,
    fetchRegistrationInfo,
    fetchProjectPubInfo,
    fetchLocationInfo,
    fetchProjectStatistics,
    fetchProjectDetails,
    setProjectsPage,
    setProjectsSort,
    searchProjects,
    reset
  }
})

