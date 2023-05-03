import { reactive } from 'vue'
import axios from 'axios'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/AuthStore.js'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    err: null,
    user: reactive({
      firstName: null,
      lastName: null,
      email: null,
      orcid: null,
      newPassword: null,
      newPasswordConfirm: null,
    }),
  }),
  getters: {
  },
  actions: {
    invalidate() {
        // this.user.firstName = null
        // this.user.lastName = null
        // this.user.email = null
        // this.user.newPassword = null
        // this.user.newPasswordConfirm = null
    },

    async getCurrentUser() {
      const authStore = useAuthStore()
      const userObj = authStore.user
      if (userObj) {
          try {
            // get user profile
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/get-profile`);
            this.user.firstName = response.data.fname
            this.user.lastName = response.data.lname
            this.user.email = response.data.email
            this.user.orcid = response.data.orcid
            return this.user
          } catch (e) {
            // TODO: display user fetch error
          }
      }
      return null
    },
  },
})

export default {
    useUserStore
}
