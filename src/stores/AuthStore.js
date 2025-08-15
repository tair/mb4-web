import axios from 'axios'
import { defineStore } from 'pinia'
import { useMessageStore } from './MessageStore'
import sessionManager from '@/lib/session-manager.js'

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

      axios
        .post(`${import.meta.env.VITE_API_URL}/auth/logout`)
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
        return false
      }

      return true
    },

    async checkProfileConfirmation() {
      try {
        if (!this.hasValidAuthToken()) {
          return { profile_confirmation_required: false }
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/check-profile-confirmation`
        )
        return response.data
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

      this.user = JSON.parse(storedUser)

      const orcidUser = localStorage.getItem('orcid-user')
      if (!orcidUser) {
        return
      }

      this.orcid = JSON.parse(orcidUser)
    },

    async getOrcidLoginUrl() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/get-orcid-login-url`
        )
        return response.data.url
      } catch (e) {
        console.error('Error getting Orcid login URL', e)
      }
    },

    getRegisterUrl() {
      return `${import.meta.env.VITE_API_URL}/auth/signup`
    },

    async login(email, password) {
      this.loading = true
      this.err = null

      try {
        const url = `${import.meta.env.VITE_API_URL}/auth/login`
        const userObj = {
          email: email,
          password: password,
        }
        if (this.orcid.orcid) {
          // Submit the user's orcid profile so it can be linked with the user's
          // MorphoBank account
          userObj.orcid = this.orcid
        }
        const res = await axios.post(url, userObj)
        const uObj = {
          authToken: res.data.accessToken,
          authTokenExpiry: res.data.accessTokenExpiry,
          userId: res.data.user.user_id,
          userEmail: res.data.user.email,
          name: res.data.user.name,
          access: res.data.user.access,
        }
        this.user = uObj

        localStorage.setItem('mb-user', JSON.stringify(uObj))
        return true
      } catch (e) {
        console.error(`store:auth:login(): ${e}\n${e.response.data.message}`)
        this.err = e.response.data.message
        return false
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      this.loading = true
      this.err = null

      try {
        const url = `${import.meta.env.VITE_API_URL}/auth/reset-password`
        let userObj = {
          email: email,
        }
        const res = await axios.post(url, userObj)

        return true
      } catch (e) {
        console.error(
          `store:auth:resetpassword(): ${e}\n${e.response.data.message}`
        )
        this.err = e.response.data.message
        return false
      } finally {
        this.loading = false
      }
    },

    async setNewPassword(resetKey, password) {
      this.loading = true
      this.err = null

      try {
        const url = `${import.meta.env.VITE_API_URL}/auth/set-new-password`
        let data = {
          resetKey: resetKey,
          password: password,
        }
        const res = await axios.post(url, data)

        return true
      } catch (e) {
        console.error(
          `store:auth:resetpassword(): ${e}\n${e.response.data.message}`
        )
        this.err = e.response.data.message
        return false
      } finally {
        this.loading = false
      }
    },

    async setORCIDProfile(authCode) {
      try {
        const url = `${import.meta.env.VITE_API_URL}/auth/authenticate-orcid`
        const body = {
          authCode: authCode,
        }
        const res = await axios.post(url, body)

        const orcidObj = {
          orcid: res.data.orcidProfile.orcid,
          name: res.data.orcidProfile.name,
          accessToken: res.data.orcidProfile.access_token,
          refreshToken: res.data.orcidProfile.refresh_token,
        }
        this.orcid = orcidObj
        localStorage.setItem('orcid-user', JSON.stringify(orcidObj))
        // have db user associated with this ORCID
        if (res.data.user) {
          const uObj = {
            authToken: res.data.accessToken,
            authTokenExpiry: res.data.accessTokenExpiry,
            userId: res.data.user.user_id,
            userEmail: res.data.user.email,
            name: res.data.user.name,
            access: res.data.user.access,
          }
          this.user = uObj
          localStorage.setItem('mb-user', JSON.stringify(uObj))
          // the user is authenticated, the handler should redirect the user to destination page
          // depending on the redirect flag
          return {
            redirectToProfile: res.data.redirectToProfile,
          }
        } else if (res.data.potentialUserByEmail) {
          return {
            messages: {
              msg: `We found an account with your email address <b>${res.data.potentialUserByEmail.email}</b> in our database.`,
              signinMsg:
                'Please sign in to that MorphoBank account with your email/pwd and link it with your ORCID id.',
            },
            showSignin: true,
            showRegister: false,
          }
        } else if (res.data.potentialUsersByName) {
          return {
            messages: {
              msg: `We found user <b>${res.data.potentialUsersByName[0].name}</b> in our database.`,
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
  },
})
