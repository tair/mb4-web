import { defineStore } from 'pinia'
import { useMessageStore } from './MessageStore'
import { useProjectUsersStore } from './ProjectUsersStore'
import sessionManager from '@/lib/session-manager.js'
import { apiService } from '@/services/apiService.js'

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    loading: false,
    err: null,
    user: {
      authToken: null,
      authTokenExpiry: null,
      userId: null,
      userEmail: null,
      name: null,
      access: null,
    },
    orcid: {
      orcid: null,
      accessToken: null,
      refreshToken: null,
      name: null,
    },
  }),
  getters: {
    isLoading(state) {
      return state.loading
    },
    isUserCurator(state) {
      return (
        state.user && state.user.access && state.user.access.includes('curator')
      )
    },
    isUserAdministrator(state) {
      return (
        state.user && state.user.access && state.user.access.includes('admin')
      )
    },
    isAnonymousReviewer(state) {
      return (
        state.user && state.user.access && state.user.access.includes('anonymous_reviewer')
      )
    },
    getAnonymousProjectId(state) {
      if (this.isAnonymousReviewer && state.user.userId) {
        // Extract project ID from user ID (format: "Project123")
        return state.user.userId.replace('Project', '')
      }
      return null
    },
  },
  actions: {
    invalidate() {
      this.user = {
        authToken: null,
        authTokenExpiry: null,
        userId: null,
        userEmail: null,
        name: null,
        access: null,
      }
      this.orcid = {
        orcid: null,
        accessToken: null,
        refreshToken: null,
        name: null,
      }
      this.err = null
      localStorage.removeItem('mb-user')
      localStorage.removeItem('orcid-user')

      // Clear session on logout
      sessionManager.clearSession()

      // Clear project-specific stores to prevent stale data when switching users
      const projectUsersStore = useProjectUsersStore()
      projectUsersStore.invalidate()

      apiService
        .post('/auth/logout')
        .then((res) => {
          //do nothing
        })
        .catch((e) => {
          //do nothing
        })
    },

    hasValidAuthToken() {
      if (!this.user?.authToken || !this.user?.authTokenExpiry) {
        return false
      }

      // Set message when the user token expires
      const expiration = Math.floor(new Date().getTime() / 1000)
      if (this.user.authTokenExpiry < expiration) {
        const message = useMessageStore()
        message.setSessionTimeOutMessage()
        // Clear expired auth state
        this.invalidate()
        
        // Redirect to login page if we're not already there
        this.redirectToLoginIfNeeded()
        return false
      }

      return true
    },

    async verifyAuthenticationWithServer() {
      if (!this.hasValidAuthToken()) {
        return false
      }

      try {
        // Use the dedicated authentication verification endpoint
        const response = await apiService.get('/users/verify-authentication')
        const responseData = await response.json()
        
        // Optionally update user info if the server provides updated data
        if (responseData && responseData.authenticated) {
          console.log('Authentication verified with server')
          return true
        } else {
          console.log('Server returned non-authenticated response')
          this.invalidate()
          const message = useMessageStore()
          message.setSessionTimeOutMessage()
          this.redirectToLoginIfNeeded()
          return false
        }
      } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Token is invalid on server side, clear local state
          console.log('Server rejected auth token, clearing local authentication state')
          this.invalidate()
          const message = useMessageStore()
          message.setSessionTimeOutMessage()
          this.redirectToLoginIfNeeded()
          return false
        }
        // For other errors, assume auth is still valid to avoid false negatives
        console.warn('Could not verify authentication with server:', error.message)
        return true
      }
    },

    redirectToLoginIfNeeded() {
      // Import router dynamically to avoid circular dependency
      import('@/router/index.js').then(({ default: router }) => {
        const currentRoute = router.currentRoute.value
        if (currentRoute.name !== 'UserLogin') {
          console.log('Session expired, redirecting to login page')
          // Persist full path as a robust fallback in case query is lost
          try { sessionStorage.setItem('mb-redirectPath', currentRoute.fullPath) } catch {}
          const query = {
            redirect: currentRoute.name,
            redirectPath: currentRoute.fullPath,
            ...(Object.keys(currentRoute.query).length > 0
              ? { originalQuery: JSON.stringify(currentRoute.query) }
              : {}),
            ...(Object.keys(currentRoute.params).length > 0
              ? { originalParams: JSON.stringify(currentRoute.params) }
              : {}),
          }
          router.push({ name: 'UserLogin', query })
        }
      }).catch(err => {
        console.warn('Could not redirect to login:', err)
      })
    },

    async checkProfileConfirmation() {
      try {
        if (!this.hasValidAuthToken()) {
          return { profile_confirmation_required: false }
        }

        const response = await apiService.get('/users/check-profile-confirmation')
        const responseData = await response.json()
        return responseData
      } catch (error) {
        console.error('Error checking profile confirmation:', error)
        // If we can't check, assume no confirmation required to avoid blocking user
        return { profile_confirmation_required: false }
      }
    },

    fetchLocalStore() {
      const storedUser = localStorage.getItem('mb-user')
      if (!storedUser) {
        return
      }

      const parsedUser = JSON.parse(storedUser)
      
      // Validate the token before restoring the user state
      if (parsedUser.authToken && parsedUser.authTokenExpiry) {
        const currentTime = Math.floor(new Date().getTime() / 1000)
        if (parsedUser.authTokenExpiry < currentTime) {
          // Token is expired, clear the stored data and don't restore state
          console.log('Stored auth token is expired, clearing localStorage')
          localStorage.removeItem('mb-user')
          localStorage.removeItem('orcid-user')
          const message = useMessageStore()
          message.setSessionTimeOutMessage()
          this.redirectToLoginIfNeeded()
          return
        }
      } else {
        // No valid token data, clear the stored data
        console.log('No valid auth token found in localStorage, clearing')
        localStorage.removeItem('mb-user')
        localStorage.removeItem('orcid-user')
        return
      }

      // Token is valid, restore the user state
      this.user = parsedUser

      const orcidUser = localStorage.getItem('orcid-user')
      if (orcidUser) {
        this.orcid = JSON.parse(orcidUser)
      }
    },

    async getOrcidLoginUrl() {
      try {
        const response = await apiService.get('/auth/get-orcid-login-url')
        const responseData = await response.json()
        return responseData.url
      } catch (e) {
        console.error('Error getting Orcid login URL', e)
      }
    },

    getRegisterUrl() {
      return apiService.buildUrl('/auth/signup')
    },

    async login(email, password) {
      this.loading = true
      this.err = null

      try {
        const url = '/auth/login'
        const userObj = {
          email: email,
          password: password,
        }
        if (this.orcid.orcid) {
          // Submit the user's orcid profile so it can be linked with the user's
          // MorphoBank account
          userObj.orcid = this.orcid
        }
        const res = await apiService.post(url, userObj)
        const resData = await res.json()
        const uObj = {
          authToken: resData.accessToken,
          authTokenExpiry: resData.accessTokenExpiry,
          userId: resData.user.user_id,
          userEmail: resData.user.email,
          name: resData.user.name,
          access: resData.user.access,
        }
        this.user = uObj

        localStorage.setItem('mb-user', JSON.stringify(uObj))
        return true
      } catch (e) {
        // apiService throws standard Error instances with a message
        let errMsg = 'Login failed. Please check your credentials and try again.'
        if (e && typeof e.message === 'string' && e.message.trim().length > 0) {
          errMsg = e.message
        } else if (typeof e === 'string' && e.trim().length > 0) {
          errMsg = e
        }
        console.error(`store:auth:login(): ${errMsg}`)
        this.err = errMsg
        return false
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      this.loading = true
      this.err = null

      try {
        const url = '/auth/reset-password'
        let userObj = {
          email: email,
        }
        const res = await apiService.post(url, userObj)

        return true
      } catch (e) {
        // Use standardized error from apiService: prefer e.message, fallback to parsed data
        let errMsg = 'Reset password failed.'
        if (e && typeof e.message === 'string' && e.message.trim().length > 0) {
          errMsg = e.message
        } else if (e && e.data && typeof e.data.message === 'string' && e.data.message.trim().length > 0) {
          errMsg = e.data.message
        }
        console.error(`store:auth:resetPassword(): ${errMsg}`)
        this.err = errMsg
        return false
      } finally {
        this.loading = false
      }
    },

    async setNewPassword(resetKey, password) {
      this.loading = true
      this.err = null

      try {
        const url = '/auth/set-new-password'
        let data = {
          resetKey: resetKey,
          password: password,
        }
        const res = await apiService.post(url, data)

        return true
      } catch (e) {
        let errMsg = 'Set new password failed.'
        if (e && typeof e.message === 'string' && e.message.trim().length > 0) {
          errMsg = e.message
        } else if (e && e.data && typeof e.data.message === 'string' && e.data.message.trim().length > 0) {
          errMsg = e.data.message
        }
        console.error(`store:auth:setNewPassword(): ${errMsg}`)
        this.err = errMsg
        return false
      } finally {
        this.loading = false
      }
    },

    async setORCIDProfile(authCode) {
      try {
        const url = '/auth/authenticate-orcid'
        const body = {
          authCode: authCode,
        }
        const res = await apiService.post(url, body)
        const resData = await res.json()

        const orcidObj = {
          orcid: resData.orcidProfile.orcid,
          name: resData.orcidProfile.name,
          accessToken: resData.orcidProfile.access_token,
          refreshToken: resData.orcidProfile.refresh_token,
        }
        this.orcid = orcidObj
        localStorage.setItem('orcid-user', JSON.stringify(orcidObj))
        // have db user associated with this ORCID
        if (resData.user) {
          const uObj = {
            authToken: resData.accessToken,
            authTokenExpiry: resData.accessTokenExpiry,
            userId: resData.user.user_id,
            userEmail: resData.user.email,
            name: resData.user.name,
            access: resData.user.access,
          }
          this.user = uObj
          localStorage.setItem('mb-user', JSON.stringify(uObj))
          // the user is authenticated, the handler should redirect the user to destination page
          // depending on the redirect flag
          return {
            redirectToProfile: resData.redirectToProfile,
          }
        } else if (resData.potentialUserByEmail) {
          return {
            messages: {
              msg: `We found an account with your email address <b>${resData.potentialUserByEmail.email}</b> in our database.`,
              signinMsg:
                'Please sign in to that MorphoBank account with your email/pwd and link it with your ORCID id.',
            },
            showSignin: true,
            showRegister: false,
          }
        } else if (resData.potentialUsersByName) {
          return {
            messages: {
              msg: `We found user <b>${resData.potentialUsersByName[0].name}</b> in our database.`,
              signinMsg:
                "If it's you, please sign in to MorphoBank with your email/pwd and link it with your ORCID id.",
              registerMsg:
                'Otherwise, please proceed to create an account with your ORCID record.',
            },
            showSignin: true,
            showRegister: true,
          }
        } else {
          return {
            messages: {
              msg: 'Please proceed to create an account with your ORCID record.',
            },
            showSignin: false,
            showRegister: true,
          }
        }
      } catch (e) {
        this.err = e
        let message =
          "We've experienced unexpected error when authenticating your profile.<br>"

        if (e.response) {
          // The server returned an error response with status code and data
          console.log(
            `store:auth:setORCIDProfile(): error status code: ${e.response.status}`
          )
          console.log(
            `store:auth:setORCIDProfile(): error data: ${e.response.data}`
          )
          if (e.response.data && e.response.data.message) {
            message += e.response.data.message + '<br>'
          }
          console.log('Error Data:', e.response.data)
        } else {
          // Other errors occurred (e.g., network error, request timeout, etc.)
          console.log(`store:auth:setORCIDProfile(): ${e.message}`)
          if (e.message) {
            message += e.message + '<br>'
          }
        }
        message += 'Please try again or come back later.'

        return {
          messages: {
            msg: message,
          },
          errorMsg: message,
          showSignin: true,
          showRegister: false,
          redirectToProfile: true, // redirect to profile page to re-link in case the user is logged in
        }
      }
    },

    async unlinkORCID() {
      try {
        const url = '/auth/unlink-orcid'
        await apiService.post(url, {})
        
        // Clear local ORCID state
        this.orcid = {
          orcid: null,
          name: null,
          accessToken: null,
          refreshToken: null,
        }
        localStorage.removeItem('orcid-user')
        return { success: true }
      } catch (e) {
        console.error('Error unlinking ORCID:', e)
        return { success: false, message: e.message || 'Failed to unlink ORCID' }
      }
    },
  },
})
