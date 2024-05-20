import { defineStore } from 'pinia'

export const useMessageStore = defineStore({
  id: 'message', // It's a good practice to include an id. This is used for devtools and hydration
  state: () => ({
    // Ensure state is a function
    message: null,
    messageType: null,
  }),
  actions: {
    setErrorMessage(message) {
      this.message = message
      this.messageType = 'danger'
    },
    setSuccessMessage(message) {
      this.message = message
      this.messageType = 'success'
    },
    setSessionTimeOutMessage() {
      this.message = 'Your session has timed out. Please login again.'
      this.messageType = 'danger'
    },
    getMessage() {
      return this.message // use 'this' to reference the state
    },
    getMessageType() {
      return this.messageType // use 'this' to reference the state
    },
    clearMessage() {
      this.message = null // use 'this' to reference the state
      this.messageType = null // use 'this' to reference the state
    },
  },
})
