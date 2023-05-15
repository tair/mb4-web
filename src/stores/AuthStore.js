import axios from 'axios'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    err: null,
    user: {
      authToken: null,
      userId: null,
      userEmail: null,
      name: null,
    },
    orcid: {
      orcid: null,
      accessToken: null,
      tokenType: null,
      name: null,
    }
  }),
  getters: {
    isLoading(state) {
      return state.loading
    },
  },
  actions: {
    invalidate() {
      this.user = null
      localStorage.removeItem('mb-user')
      localStorage.removeItem('orcid-user')
    },

    fetchLocalStore() {
      let lsUser = localStorage.getItem('mb-user')
      if (!lsUser) return

      lsUser = JSON.parse(lsUser)
      this.user = lsUser
    },

    async getOrcidLoginUrl() {
      try {
        const response =  await axios.get(`${import.meta.env.VITE_API_URL}/auth/get-orcid-login-url`)
        return response.data.url
      } catch (e) {
        console.error('Error getting Orcid login URL', e);
      }
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
        const res = await axios.post(url, userObj)
        const uObj = {
          authToken: res.data.accessToken,
          userId: res.data.user.user_id,
          userEmail: res.data.user.email,
          name: res.data.user.name,
        }
        this.user = uObj

        localStorage.setItem('mb-user', JSON.stringify(uObj))
        console.log('Login successful')
        return true
      } catch (e) {
        console.error(`store:auth:login(): ${e}\n${e.response.data.message}`)
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
          authCode: authCode
        }
        const res = await axios.post(url, body)
        
        const orcidObj = {
          orcid: res.data.orcidProfile.orcid,
          accessToken: res.data.orcidProfile.access_token,
          tokenType: res.data.orcidProfile.token_type,
          name: res.data.orcidProfile.name,
        }
        this.orcid = orcidObj
        localStorage.setItem('orcid-user', JSON.stringify(orcidObj))

        // have db user associated with this ORCID
        if (res.data.user) {
          const uObj = {
            authToken: res.data.accessToken,
            userId: res.data.user.user_id,
            userEmail: res.data.user.email,
            name: res.data.user.name,
          }
          this.user = uObj
          localStorage.setItem('mb-user', JSON.stringify(uObj))
        } else if (res.data.potentialUsers) {
          // TODO: handle case when user is not associated but has potential user
        }

        return true
      } catch (e) {
        console.error(`store:auth:setORCIDProfile(): ${e}\n${e.response.data.message}`)
        this.err = e.response.data.message
        return false
      }
    }
  },
})
