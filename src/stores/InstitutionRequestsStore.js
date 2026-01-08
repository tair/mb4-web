import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useInstitutionRequestsStore = defineStore({
  id: 'institutionRequests',
  state: () => ({
    // Request list state
    requests: [],
    requestsLoading: false,
    requestsError: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0
    },
    
    // Stats for dashboard
    stats: null,
    statsLoading: false,
    statsError: null,
    
    // Single request detail
    currentRequest: null,
    currentRequestLoading: false,
    currentRequestError: null,
    
    // Institution management
    institutions: [],
    institutionsLoading: false,
    institutionsError: null,
    institutionsPagination: {
      total: 0,
      page: 1,
      limit: 50,
      pages: 0
    },
    
    // Current institution for editing
    currentInstitution: null,
    currentInstitutionLoading: false,
    currentInstitutionError: null,
  }),
  
  getters: {
    isRequestsLoaded(state) {
      return state.requests.length > 0 && !state.requestsLoading
    },
    pendingRequestsCount(state) {
      return state.stats?.counts?.new || 0
    },
    approvedRequestsCount(state) {
      return state.stats?.counts?.approved || 0
    },
    rejectedRequestsCount(state) {
      return state.stats?.counts?.rejected || 0
    },
  },
  
  actions: {
    /**
     * Fetch institution request statistics for curator dashboard
     */
    async fetchStats(limit = 5) {
      this.statsLoading = true
      this.statsError = null
      
      try {
        const res = await apiService.get('/curation-requests/institutions/stats', {
          params: { limit }
        })
        const data = await res.json()
        
        if (data.success) {
          this.stats = data.data
        } else {
          throw new Error(data.message || 'Failed to fetch stats')
        }
      } catch (error) {
        console.error('Error fetching institution request stats:', error)
        this.statsError = error.message
      } finally {
        this.statsLoading = false
      }
    },
    
    /**
     * Fetch institution requests with filtering and pagination
     */
    async fetchRequests({ status, page = 1, limit = 20 } = {}) {
      this.requestsLoading = true
      this.requestsError = null
      
      try {
        const params = { page, limit }
        if (status !== undefined && status !== '') {
          params.status = status
        }
        
        const res = await apiService.get('/curation-requests/institutions', { params })
        const data = await res.json()
        
        if (data.success) {
          this.requests = data.data.requests
          this.pagination = data.data.pagination
        } else {
          throw new Error(data.message || 'Failed to fetch requests')
        }
      } catch (error) {
        console.error('Error fetching institution requests:', error)
        this.requestsError = error.message
      } finally {
        this.requestsLoading = false
      }
    },
    
    /**
     * Fetch a single institution request by ID
     */
    async fetchRequest(requestId) {
      this.currentRequestLoading = true
      this.currentRequestError = null
      
      try {
        const res = await apiService.get(`/curation-requests/institutions/${requestId}`)
        const data = await res.json()
        
        if (data.success) {
          this.currentRequest = data.data
        } else {
          throw new Error(data.message || 'Failed to fetch request')
        }
      } catch (error) {
        console.error('Error fetching institution request:', error)
        this.currentRequestError = error.message
      } finally {
        this.currentRequestLoading = false
      }
    },
    
    /**
     * Approve an institution request
     */
    async approveRequest(requestId, institutionName = null) {
      try {
        const body = { status: 1 }
        if (institutionName) {
          body.institutionName = institutionName
        }
        
        const res = await apiService.put(`/curation-requests/institutions/${requestId}`, body)
        const data = await res.json()
        
        if (data.success) {
          // Update local state
          if (this.currentRequest?.request_id === requestId) {
            this.currentRequest = data.data
          }
          
          // Update list if loaded
          const index = this.requests.findIndex(r => r.request_id === requestId)
          if (index !== -1) {
            this.requests[index] = { ...this.requests[index], ...data.data }
          }
          
          return { success: true, data: data.data }
        } else {
          throw new Error(data.message || 'Failed to approve request')
        }
      } catch (error) {
        console.error('Error approving institution request:', error)
        return { success: false, error: error.message }
      }
    },
    
    /**
     * Reject an institution request
     */
    async rejectRequest(requestId) {
      try {
        const res = await apiService.put(`/curation-requests/institutions/${requestId}`, {
          status: 2
        })
        const data = await res.json()
        
        if (data.success) {
          // Update local state
          if (this.currentRequest?.request_id === requestId) {
            this.currentRequest = data.data
          }
          
          // Update list if loaded
          const index = this.requests.findIndex(r => r.request_id === requestId)
          if (index !== -1) {
            this.requests[index] = { ...this.requests[index], ...data.data }
          }
          
          return { success: true, data: data.data }
        } else {
          throw new Error(data.message || 'Failed to reject request')
        }
      } catch (error) {
        console.error('Error rejecting institution request:', error)
        return { success: false, error: error.message }
      }
    },
    
    /**
     * Update an institution request (generic update without forcing status)
     */
    async updateRequest(requestId, { institutionName, status } = {}) {
      try {
        const body = {}
        if (institutionName !== undefined) body.institutionName = institutionName
        if (status !== undefined) body.status = status
        
        const res = await apiService.put(`/curation-requests/institutions/${requestId}`, body)
        const data = await res.json()
        
        if (data.success) {
          // Update local state
          if (this.currentRequest?.request_id === requestId) {
            this.currentRequest = data.data
          }
          
          // Update list if loaded
          const index = this.requests.findIndex(r => r.request_id === requestId)
          if (index !== -1) {
            this.requests[index] = { ...this.requests[index], ...data.data }
          }
          
          return { success: true, data: data.data }
        } else {
          throw new Error(data.message || 'Failed to update request')
        }
      } catch (error) {
        console.error('Error updating institution request:', error)
        return { success: false, error: error.message }
      }
    },
    
    /**
     * Search institutions for remap dropdown
     */
    async searchInstitutions(query, excludeId = null) {
      try {
        const params = { search: query, limit: 20, active: true }
        const res = await apiService.get('/curator/institutions', { params })
        const data = await res.json()
        
        if (data.success) {
          let institutions = data.data.institutions || []
          // Exclude the institution being deleted
          if (excludeId) {
            institutions = institutions.filter(i => i.institution_id !== excludeId)
          }
          return { success: true, institutions }
        } else {
          throw new Error(data.message || 'Failed to search institutions')
        }
      } catch (error) {
        console.error('Error searching institutions:', error)
        return { success: false, error: error.message, institutions: [] }
      }
    },
    
    /**
     * Delete an institution request
     */
    async deleteRequest(requestId, { deleteInstitution = false, remapToId = null } = {}) {
      try {
        const res = await apiService.delete(`/curation-requests/institutions/${requestId}`, {
          deleteInstitution,
          remapToId
        })
        const data = await res.json()
        
        if (data.success) {
          // Remove from local list
          this.requests = this.requests.filter(r => r.request_id !== requestId)
          
          // Clear current request if it was deleted
          if (this.currentRequest?.request_id === requestId) {
            this.currentRequest = null
          }
          
          return { success: true }
        } else {
          // Return the usageCount if present (for remap dialog)
          return { 
            success: false, 
            error: data.message || 'Failed to delete request',
            usageCount: data.usageCount
          }
        }
      } catch (error) {
        console.error('Error deleting institution request:', error)
        return { success: false, error: error.message }
      }
    },
    
    /**
     * Fetch all institutions for curator management
     */
    async fetchInstitutions({ page = 1, limit = 50, search = '', active } = {}) {
      this.institutionsLoading = true
      this.institutionsError = null
      
      try {
        const params = { page, limit }
        if (search) params.search = search
        if (active !== undefined) params.active = active
        
        const res = await apiService.get('/curator/institutions', { params })
        const data = await res.json()
        
        if (data.success) {
          this.institutions = data.data.institutions
          this.institutionsPagination = data.data.pagination
        } else {
          throw new Error(data.message || 'Failed to fetch institutions')
        }
      } catch (error) {
        console.error('Error fetching institutions:', error)
        this.institutionsError = error.message
      } finally {
        this.institutionsLoading = false
      }
    },
    
    /**
     * Fetch a single institution with usage details
     */
    async fetchInstitution(institutionId) {
      this.currentInstitutionLoading = true
      this.currentInstitutionError = null
      
      try {
        const res = await apiService.get(`/curator/institutions/${institutionId}`)
        const data = await res.json()
        
        if (data.success) {
          this.currentInstitution = data.data
        } else {
          throw new Error(data.message || 'Failed to fetch institution')
        }
      } catch (error) {
        console.error('Error fetching institution:', error)
        this.currentInstitutionError = error.message
      } finally {
        this.currentInstitutionLoading = false
      }
    },
    
    /**
     * Update an institution
     */
    async updateInstitution(institutionId, { name, active }) {
      try {
        const body = {}
        if (name !== undefined) body.name = name
        if (active !== undefined) body.active = active
        
        const res = await apiService.put(`/curator/institutions/${institutionId}`, body)
        const data = await res.json()
        
        if (data.success) {
          // Update local state
          if (this.currentInstitution?.institution_id === institutionId) {
            this.currentInstitution = { ...this.currentInstitution, ...data.data }
          }
          
          // Update list if loaded
          const index = this.institutions.findIndex(i => i.institution_id === institutionId)
          if (index !== -1) {
            this.institutions[index] = { ...this.institutions[index], ...data.data }
          }
          
          return { success: true, data: data.data }
        } else {
          throw new Error(data.message || 'Failed to update institution')
        }
      } catch (error) {
        console.error('Error updating institution:', error)
        return { success: false, error: error.message }
      }
    },
    
    /**
     * Delete an institution with optional remapping
     */
    async deleteInstitution(institutionId, remapToId = null) {
      try {
        const body = remapToId ? { remapToId } : {}
        
        const res = await apiService.delete(`/curator/institutions/${institutionId}`, body)
        const data = await res.json()
        
        if (data.success) {
          // Remove from local list
          this.institutions = this.institutions.filter(i => i.institution_id !== institutionId)
          
          // Clear current institution if it was deleted
          if (this.currentInstitution?.institution_id === institutionId) {
            this.currentInstitution = null
          }
          
          return { success: true }
        } else {
          throw new Error(data.message || 'Failed to delete institution')
        }
      } catch (error) {
        console.error('Error deleting institution:', error)
        return { success: false, error: error.message, usageCount: error.usageCount }
      }
    },
    
    /**
     * Clear current request
     */
    clearCurrentRequest() {
      this.currentRequest = null
      this.currentRequestError = null
    },
    
    /**
     * Clear current institution
     */
    clearCurrentInstitution() {
      this.currentInstitution = null
      this.currentInstitutionError = null
    },
    
    /**
     * Reset all state
     */
    reset() {
      this.requests = []
      this.requestsLoading = false
      this.requestsError = null
      this.pagination = { total: 0, page: 1, limit: 20, pages: 0 }
      this.stats = null
      this.statsLoading = false
      this.statsError = null
      this.currentRequest = null
      this.currentRequestLoading = false
      this.currentRequestError = null
      this.institutions = []
      this.institutionsLoading = false
      this.institutionsError = null
      this.institutionsPagination = { total: 0, page: 1, limit: 50, pages: 0 }
      this.currentInstitution = null
      this.currentInstitutionLoading = false
      this.currentInstitutionError = null
    }
  },
})

export default {
  useInstitutionRequestsStore,
}

