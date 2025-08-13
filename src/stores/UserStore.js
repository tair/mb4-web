import axios from 'axios'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/AuthStore.js'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    err: {},
    originalUser: {
      firstName: null,
      lastName: null,
      email: null,
      orcid: null,
      institutions: null,
      isInstitutionUnaffiliated: false,
    },
    userForm: {
      firstName: null,
      lastName: null,
      email: null,
      newPassword: null,
      newPasswordConfirm: null,
      institutions: null,
      isInstitutionUnaffiliated: false,
    },
  }),
  getters: {},
  actions: {
    reset() {
      this.initUserFormValue()
      this.userForm.newPassword = null
      this.userForm.newPasswordConfirm = null
      this.err = {}
    },

    async fetchCurrentUser() {
      const authStore = useAuthStore()
      const userObj = authStore.user
      if (userObj) {
        try {
          // get user profile
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/users/get-profile`
          )
          this.setUserValue(response.data)
          this.initUserFormValue()
        } catch (e) {
          // TODO: display user fetch error
          console.log(e)
          this.err.fetchErr = e.response.data.message
          throw e
        }
      }
    },

    async updateUser() {
      try {
        // get user profile
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/users/update-profile`,
          this.userForm
        )
        this.setUserValue(response.data.user)
        this.reset()
      } catch (e) {
        // TODO: display user fetch error
        console.log(e)
        this.err.updateErr = e.response.data.message
        throw e
      }
    },

    setUserValue(responseData) {
      this.originalUser.firstName = responseData.fname
      this.originalUser.lastName = responseData.lname
      this.originalUser.email = responseData.email
      this.originalUser.orcid = responseData.orcid
      this.originalUser.institutions = responseData.institutions
      this.originalUser.isInstitutionUnaffiliated = responseData.is_institution_unaffiliated || false
    },

    initUserFormValue() {
      this.userForm.firstName = this.originalUser.firstName
      this.userForm.lastName = this.originalUser.lastName
      this.userForm.email = this.originalUser.email
      this.userForm.institutions = [...this.originalUser.institutions]
      this.userForm.isInstitutionUnaffiliated = this.originalUser.isInstitutionUnaffiliated
    },
  },
})

export default {
  useUserStore,
}
