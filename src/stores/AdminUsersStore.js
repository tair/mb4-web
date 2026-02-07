import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useAdminUsersStore = defineStore({
  id: 'adminUsers',
  state: () => ({
    // User list state
    users: [],
    pagination: {
      total: 0,
      page: 1,
      perPage: 25,
      totalPages: 0,
    },
    filters: {
      status: 'active',
      search: '',
      sortBy: 'lname',
      sortOrder: 'asc',
    },
    isLoading: false,
    isListLoaded: false,

    // Current user state (for edit view)
    currentUser: null,
    isUserLoading: false,
    isUserLoaded: false,

    // Roles state
    roles: [],
    isRolesLoaded: false,

    // Stats for dashboard
    stats: null,
    isStatsLoaded: false,

    // Error state
    error: null,
  }),

  getters: {
    getUserById: (state) => (userId) => {
      return state.users.find((u) => u.user_id === userId)
    },
    activeUsersCount: (state) => state.stats?.totalActive || 0,
    pendingUsersCount: (state) => state.stats?.pendingApproval || 0,
    totalUsersCount: (state) => state.stats?.total || 0,
  },

  actions: {
    /**
     * Invalidate the store state
     */
    invalidate() {
      this.users = []
      this.pagination = {
        total: 0,
        page: 1,
        perPage: 25,
        totalPages: 0,
      }
      this.isListLoaded = false
      this.currentUser = null
      this.isUserLoaded = false
      this.error = null
    },

    /**
     * Set filters and refetch users
     */
    setFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
      this.pagination.page = 1 // Reset to first page when filters change
      return this.fetchUsers()
    },

    /**
     * Set page and refetch users
     */
    setPage(page) {
      this.pagination.page = page
      return this.fetchUsers()
    },

    /**
     * Fetch users with current filters and pagination
     */
    async fetchUsers() {
      this.isLoading = true
      this.error = null

      try {
        const params = {
          status: this.filters.status,
          search: this.filters.search,
          sortBy: this.filters.sortBy,
          sortOrder: this.filters.sortOrder,
          page: this.pagination.page,
          perPage: this.pagination.perPage,
        }

        const response = await apiService.get('/admin/users', { params })
        const data = await response.json()

        if (data.success) {
          this.users = data.data.users
          this.pagination = data.data.pagination
          this.isListLoaded = true
        } else {
          throw new Error(data.message || 'Failed to fetch users')
        }
      } catch (e) {
        console.error('Error fetching users:', e)
        this.error = e.message || 'Failed to fetch users'
        throw e
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch a single user by ID
     */
    async fetchUser(userId) {
      this.isUserLoading = true
      this.error = null

      try {
        const response = await apiService.get(`/admin/users/${userId}`)
        const data = await response.json()

        if (data.success) {
          this.currentUser = data.data
          this.isUserLoaded = true
          return data.data
        } else {
          throw new Error(data.message || 'Failed to fetch user')
        }
      } catch (e) {
        console.error('Error fetching user:', e)
        this.error = e.message || 'Failed to fetch user'
        throw e
      } finally {
        this.isUserLoading = false
      }
    },

    /**
     * Create a new user
     */
    async createUser(userData) {
      try {
        const response = await apiService.post('/admin/users', userData)
        const data = await response.json()

        if (data.success) {
          // Refresh the list
          await this.fetchUsers()
          return data.data
        } else {
          throw new Error(data.message || 'Failed to create user')
        }
      } catch (e) {
        console.error('Error creating user:', e)
        this.error = e.message || 'Failed to create user'
        throw e
      }
    },

    /**
     * Update user details
     */
    async updateUser(userId, userData) {
      try {
        const response = await apiService.put(`/admin/users/${userId}`, userData)
        const data = await response.json()

        if (data.success) {
          // Update the user in the list if present
          const index = this.users.findIndex((u) => u.user_id === userId)
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...userData }
          }
          // Refresh current user if loaded
          if (this.currentUser && this.currentUser.user_id === userId) {
            await this.fetchUser(userId)
          }
          return data
        } else {
          throw new Error(data.message || 'Failed to update user')
        }
      } catch (e) {
        console.error('Error updating user:', e)
        this.error = e.message || 'Failed to update user'
        throw e
      }
    },

    /**
     * Delete (soft) a user
     */
    async deleteUser(userId) {
      try {
        const response = await apiService.delete(`/admin/users/${userId}`)
        const data = await response.json()

        if (data.success) {
          // Remove from list
          this.users = this.users.filter((u) => u.user_id !== userId)
          // Clear current user if it was the deleted one
          if (this.currentUser && this.currentUser.user_id === userId) {
            this.currentUser = null
            this.isUserLoaded = false
          }
          return data
        } else {
          throw new Error(data.message || 'Failed to delete user')
        }
      } catch (e) {
        console.error('Error deleting user:', e)
        this.error = e.message || 'Failed to delete user'
        throw e
      }
    },

    /**
     * Activate a user
     */
    async activateUser(userId, sendEmail = true) {
      try {
        const response = await apiService.post(`/admin/users/${userId}/activate`, {
          sendEmail,
        })
        const data = await response.json()

        if (data.success) {
          // Update the user in the list
          const index = this.users.findIndex((u) => u.user_id === userId)
          if (index !== -1) {
            this.users[index].active = true
            this.users[index].status = 'active'
          }
          // Refresh current user if loaded
          if (this.currentUser && this.currentUser.user_id === userId) {
            this.currentUser.active = true
            this.currentUser.status = 'active'
          }
          return data
        } else {
          throw new Error(data.message || 'Failed to activate user')
        }
      } catch (e) {
        console.error('Error activating user:', e)
        this.error = e.message || 'Failed to activate user'
        throw e
      }
    },

    /**
     * Deactivate a user
     */
    async deactivateUser(userId) {
      try {
        const response = await apiService.post(`/admin/users/${userId}/deactivate`)
        const data = await response.json()

        if (data.success) {
          // Update the user in the list
          const index = this.users.findIndex((u) => u.user_id === userId)
          if (index !== -1) {
            this.users[index].active = false
            this.users[index].status = 'inactive'
          }
          // Refresh current user if loaded
          if (this.currentUser && this.currentUser.user_id === userId) {
            this.currentUser.active = false
            this.currentUser.status = 'inactive'
          }
          return data
        } else {
          throw new Error(data.message || 'Failed to deactivate user')
        }
      } catch (e) {
        console.error('Error deactivating user:', e)
        this.error = e.message || 'Failed to deactivate user'
        throw e
      }
    },

    /**
     * Fetch all available roles
     */
    async fetchRoles() {
      if (this.isRolesLoaded) {
        return this.roles
      }

      try {
        const response = await apiService.get('/admin/users/roles/all')
        const data = await response.json()

        if (data.success) {
          this.roles = data.data
          this.isRolesLoaded = true
          return data.data
        } else {
          throw new Error(data.message || 'Failed to fetch roles')
        }
      } catch (e) {
        console.error('Error fetching roles:', e)
        this.error = e.message || 'Failed to fetch roles'
        throw e
      }
    },

    /**
     * Update user roles
     */
    async updateUserRoles(userId, roleIds) {
      try {
        const response = await apiService.put(`/admin/users/${userId}/roles`, {
          roleIds,
        })
        const data = await response.json()

        if (data.success) {
          // Refresh current user if loaded
          if (this.currentUser && this.currentUser.user_id === userId) {
            await this.fetchUser(userId)
          }
          return data
        } else {
          throw new Error(data.message || 'Failed to update user roles')
        }
      } catch (e) {
        console.error('Error updating user roles:', e)
        this.error = e.message || 'Failed to update user roles'
        throw e
      }
    },

    /**
     * Update user institutions
     */
    async updateUserInstitutions(userId, institutionIds) {
      try {
        const response = await apiService.put(`/admin/users/${userId}/institutions`, {
          institutionIds,
        })
        const data = await response.json()

        if (data.success) {
          // Refresh current user if loaded
          if (this.currentUser && this.currentUser.user_id === userId) {
            await this.fetchUser(userId)
          }
          return data
        } else {
          throw new Error(data.message || 'Failed to update user institutions')
        }
      } catch (e) {
        console.error('Error updating user institutions:', e)
        this.error = e.message || 'Failed to update user institutions'
        throw e
      }
    },

    /**
     * Fetch user statistics for dashboard
     */
    async fetchStats() {
      try {
        const response = await apiService.get('/admin/users/stats')
        const data = await response.json()

        if (data.success) {
          this.stats = data.data
          this.isStatsLoaded = true
          return data.data
        } else {
          throw new Error(data.message || 'Failed to fetch user stats')
        }
      } catch (e) {
        console.error('Error fetching user stats:', e)
        this.error = e.message || 'Failed to fetch user stats'
        throw e
      }
    },

    /**
     * Search institutions (uses existing endpoint)
     */
    async searchInstitutions(query) {
      try {
        const response = await apiService.get('/users/search-institutions', {
          params: { searchTerm: query },
        })
        const data = await response.json()
        // Response is an array of institutions directly
        return Array.isArray(data) ? data : []
      } catch (e) {
        console.error('Error searching institutions:', e)
        return []
      }
    },

    /**
     * Get user's data usage across all tables (for merge preview)
     */
    async getUserUsage(userId) {
      try {
        const response = await apiService.get(`/admin/users/${userId}/usage`)
        const data = await response.json()

        if (data.success) {
          return data.data
        } else {
          throw new Error(data.message || 'Failed to get user usage')
        }
      } catch (e) {
        console.error('Error getting user usage:', e)
        this.error = e.message || 'Failed to get user usage'
        throw e
      }
    },

    /**
     * Merge one user's data into another user
     * @param {number} sourceUserId - User ID to merge from (will have data transferred)
     * @param {number} targetUserId - User ID to merge into (will receive data)
     * @param {boolean} deleteSourceUser - Whether to soft-delete the source user after merge
     */
    async mergeUsers(sourceUserId, targetUserId, deleteSourceUser = false) {
      try {
        const response = await apiService.post('/admin/users/merge', {
          sourceUserId,
          targetUserId,
          deleteSourceUser,
        })
        const data = await response.json()

        if (data.success) {
          // Refresh the list after merge
          await this.fetchUsers()
          return data.data
        } else {
          throw new Error(data.message || 'Failed to merge users')
        }
      } catch (e) {
        console.error('Error merging users:', e)
        this.error = e.message || 'Failed to merge users'
        throw e
      }
    },

    /**
     * Search users for autocomplete (lightweight search)
     */
    async searchUsers(query) {
      try {
        const response = await apiService.get('/admin/users', {
          params: {
            search: query,
            status: 'all',
            perPage: 20,
            page: 1,
          },
        })
        const data = await response.json()

        if (data.success) {
          return data.data.users
        } else {
          throw new Error(data.message || 'Failed to search users')
        }
      } catch (e) {
        console.error('Error searching users:', e)
        return []
      }
    },
  },
})

