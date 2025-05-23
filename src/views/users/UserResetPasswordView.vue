<script setup>
import { reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
import Alert from '@/components/main/Alert.vue'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()
const state = reactive({
  email: null,
})
const message = reactive({
  message: null,
  messageType: null,
})

// Extract email from URL query parameters if present
onMounted(() => {
  const emailParam = route.query.email
  if (emailParam) {
    state.email = emailParam
  }
})

const submitForm = async () => {
  try {
    const resetSuccess = await authStore.resetPassword(state.email)

    if (resetSuccess) {
      message.message = `An reset password email has been sent to ${state.email}`
      message.messageType = 'success'
    } else {
      message.messageType = 'danger'
      if (authStore.err) {
        message.message = `Reset password failed. ${authStore.err}`
      } else {
        message.message = 'Reset password failed. Please try again.'
      }
    }
  } catch (error) {
    // Handle any unexpected errors
    message.message = 'An unexpected error occurred. Please try again.'
    message.messageType = 'danger'
    console.error(error) // Log the error for debugging purposes
  }
}
</script>

<template>
  <div class="form-reset-password container">
    <div class="row">
      <div class="col-md-8">
        <h3 class="mb-3 fw-normal">Reset Your Password</h3>
        <p>
          To reset your password, enter the e-mail address you used to register
          below. <br />
          A message will be sent to the address with instructions on how to
          reset your password.
        </p>
        <form @submit.prevent="submitForm()">
          <div class="form-group">
            <input
              v-model.trim="state.email"
              id="email"
              type="text"
              class="form-control w-50"
              required
            />
          </div>
          <Alert
            v-if="message.message"
            :message="message"
            messageName="message"
            :alertType="message.messageType"
            class="w-50"
          ></Alert>
          <button class="w-50 btn btn-lg btn-primary mt-3" type="submit">
            Reset
          </button>
          <br />
          <router-link
            to="login"
            class="w-50 btn btn-lg btn-primary btn-white mt-3"
          >
            Back
          </router-link>
        </form>
      </div>
      <div class="col-md-4"></div>
    </div>
  </div>
</template>

<style scoped>
.form-reset-password {
  width: 100%;
  /* max-width: 600px;  */
  padding: 15px;
}
</style>
