<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
import { getPasswordPattern, getPasswordRule } from '@/utils/util.js'
import { useRoute } from 'vue-router'
import { useMessageStore } from '@/stores/MessageStore.js'
import router from '../../router'
import Alert from '@/components/main/Alert.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const passwordTooltipText = getPasswordRule()
const confirmPasswordText = 'Please enter the password exactly as above.'
const resetKey = route.query.key
const state = reactive({
  password: '',
  password2: '',
})
const message = reactive({
  message: null,
  messageType: null,
})
const validResetKey = ref(true)
//adding check while typing
const error = reactive({})

const validatePassword = function () {
  const passwordValidation = getPasswordPattern()
  if (!passwordValidation.test(state.password)) {
    error.passwordValidation = getPasswordRule()
    return false
  } else {
    error.passwordValidation = null
    return true
  }
}

const confirmPassword = function () {
  if (
    (state.password || state.password2) &&
    state.password != state.password2
  ) {
    error.passwordConfirm = 'Passwords do not match.'
    return false
  } else {
    error.passwordConfirm = null
    return true
  }
}

const submitForm = async () => {
  if (!validatePassword() || !confirmPassword()) return

  try {
    const resetSuccess = await authStore.setNewPassword(
      resetKey,
      state.password
    )

    if (resetSuccess) {
      // redirect to login
      messageStore.setSuccessMessage(
        'Set New Password Succeeded! Please log in.'
      )
      router.push({ path: '/users/login' })
    } else {
      message.messageType = 'danger'
      if (authStore.err) {
        message.message = `Set new password failed. ${authStore.err}`
      } else {
        message.message = 'Set new password failed. Please try again.'
      }
    }
  } catch (error) {
    // Handle any unexpected errors
    message.message = 'An unexpected error occurred. Please try again.'
    message.messageType = 'danger'
    console.error(error) // Log the error for debugging purposes
  }
}

onMounted(async () => {
  try {
    const response = await apiService.get('/auth/validate-reset-key', {
      params: { resetKey }
    })
  } catch (error) {
    console.log('Checking reset key failed')
    console.log(error)
    validResetKey.value = false
  }
})
</script>

<template>
  <div class="form-reset-password container" v-if="validResetKey">
    <div class="row">
      <div class="col-md-8">
        <h3 class="mb-3 fw-normal">Reset Your Password</h3>
        <p>Please enter your new password.</p>
        <form @submit.prevent="submitForm()">
          <div class="form-group">
            <div class="input-container w-50">
              <label for="password"
                >Password* <Tooltip :content="passwordTooltipText"></Tooltip
              ></label>
              <input
                class="input-field"
                v-model.trim="state.password"
                type="password"
                name="password"
                autocomplete="new-password"
                @blur="validatePassword"
                required
              />
              <Alert
                :message="error"
                messageName="passwordValidation"
                alertType="danger"
              ></Alert>
            </div>
            <div class="input-container w-50">
              <label for="password2"
                >Confirm Password*
                <Tooltip :content="confirmPasswordText"></Tooltip
              ></label>
              <input
                class="input-field"
                v-model.trim="state.password2"
                type="password"
                name="password2"
                autocomplete="new-password"
                @blur="confirmPassword"
                required
              />
              <Alert
                :message="error"
                messageName="passwordConfirm"
                alertType="danger"
              ></Alert>
            </div>
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
  <div v-else>
    <h3 class="mb-3 fw-normal">Invalid Reset Password Key</h3>
    <p>
      We cannot reset your password at this time. If you have any question,
      please contact us via the
      <router-link to="/askus">Ask Us</router-link> form.
    </p>
  </div>
</template>

<style scoped>
.form-reset-password {
  width: 100%;
  /* max-width: 600px;  */
  padding: 15px;
}
</style>
