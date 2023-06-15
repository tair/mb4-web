import { defineStore } from 'pinia'

export const useMessageStore = defineStore({
  id: 'message', // It's a good practice to include an id. This is used for devtools and hydration
  state: () => ({  // Ensure state is a function
    message: null
  }),
  actions: {
    setMessage(message) {
      this.message = message // use 'this' to reference the state
    },
    getMessage() {
      return this.message  // use 'this' to reference the state
    },
    clearMessage() {
      this.message = null  // use 'this' to reference the state
    }
  }
})
