import axios from 'axios'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    err: null,
    user: {
      authToken: null,
      authTokenExpiry: null,
      userId: null,
      userEmail: null,
      name: null,
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
  },
  actions: {
    invalidate() {
      this.user = {
        authToken: null,
        authTokenExpiry: null,
        userId: null,
        userEmail: null,
        name: null,
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
      axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`)
      .then(res => {
        //do nothing
      }).catch(e => {
        //do nothing
      })
    },

    hasValidAuthToken() {
      if (!this.user?.authToken || !this.user?.authTokenExpiry) return false
      return Math.floor(new Date().getTime() / 1000) < this.user.authTokenExpiry
    },

    fetchLocalStore() {
      let lsUser = localStorage.getItem('mb-user')
      if (!lsUser) return

      lsUser = JSON.parse(lsUser)
      this.user = lsUser

      let orcidUser = localStorage.getItem('orcid-user')
      if (!orcidUser) return

      this.orcid = JSON.parse(orcidUser)
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
        let userObj = {
          email: email,
          password: password,
        }
        if (this.orcid.orcid) {
          userObj.orcid = this.orcid
        }
        const res = await axios.post(url, userObj)
        const uObj = {
          authToken: res.data.accessToken,
          authTokenExpiry: res.data.accessTokenExpiry,
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
          name: res.data.orcidProfile.name,
          accessToken: res.data.orcidProfile.access_token,
          refreshToken: res.data.orcidProfile.refresh_token
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
          }
          this.user = uObj
          localStorage.setItem('mb-user', JSON.stringify(uObj))
          // the user is authenticated, the handler should redirect the user to destination page
          // no message to display
          return true
        } else if (res.data.potentialUserByEmail) {
          return {
            messages: {
              msg: `We find your email address <b>${res.data.potentialUserByEmail.email}</b> in our database.`,
              signinMsg: 'Please sign in to MorphoBank to link with your ORCID account.'
            },
            showSignin: true,
            showRegister: false
          }
        } else if (res.data.potentialUsersByName) {
          return {
            messages: {
              msg: `We find user <b>${res.data.potentialUsersByName[0].name}</b> in our database.`,
              signinMsg: "If it's you, please sign in to MorphoBank to link with your ORCID account.",
              registerMsg: "Otherwise, please proceed to create an account with your ORCID record."
            },
            showSignin: true,
            showRegister: true
          }
        } else {
          return {
            messages: {
              msg: 'Please proceed to create an account with your ORCID record.',
            },
            showSignin: false,
            showRegister: true
          }
        }

      } catch (e) {
        console.error(`store:auth:setORCIDProfile(): ${e}`)
        this.err = e
        return {
          messages: {
            msg: "We've experienced unexpected error when authenticating your profile.<br>Please try again or come back later."
          },
          showSignin: true,
          showRegister: false
        }
      }
    }
  },
})
