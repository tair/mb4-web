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
      userName: null,
    },
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
    },

    fetchLocalStore() {
      let lsUser = localStorage.getItem('mb-user')
      if (!lsUser) return

      lsUser = JSON.parse(lsUser)
      this.user = lsUser
    },
    async fetchUsers() {
      if (!this.user?.authToken) {
        throw new Error('Auth token is invalid!')
      }

      const url = `${import.meta.env.VITE_API_URL}/users`
      try {
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${this.user.authToken}`,
          },
        })
        console.log(res.data)
      } catch (e) {
        console.error(
          `store:auth:fetchUsers(): ${e}\n${e.response.data.message}`
        )
        this.err = 'Error while fetching users.'
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
          userId: res.data.user.userId,
          userEmail: res.data.user.email,
          userName: res.data.user.name,
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
  },
})
