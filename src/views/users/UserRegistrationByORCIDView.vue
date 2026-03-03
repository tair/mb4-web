<template>
  <div id="registerForm" class="container">
    <div class="row">
      <div class="col-md-6">
        <div class="interior_mainheader_title">
          <h1>Register with ORCID</h1>
          <div>
            <p>
              New to Morphobank? Register to create your own projects. Logging
              in with your ORCID will create a new account for you based on that
              ID.
            </p>
          </div>
          <div><br /><i>* indicates required fields.</i></div>
        </div>

        <!-- Show ORCID login button when no ORCID is present -->
        <div v-if="!authStore.orcid.orcid" class="text-center">
          <a
            :href="orcidLoginUrl"
            class="w-100 btn btn-lg btn-primary btn-white mt-3"
          >
            <img
              alt="ORCID logo"
              src="/ORCIDiD_iconvector.svg"
              class="orcid-icon"
            />
            Sign in with ORCID
          </a>
        </div>

        <!-- Show registration form when ORCID is present -->
        <form v-else @submit.prevent="submitForm">
          <div class="form-section">
            <div class="input-container">
              <br />
              <label for="fname">First Name*</label>
              <input
                class="input-field"
                v-model.trim="state.fname"
                name="fname"
                type="text"
                id="fname"
                required
              />
            </div>
            <div class="input-container">
              <label for="lname">Last Name*</label>
              <input
                class="input-field"
                v-model.trim="state.lname"
                name="lname"
                type="text"
                id="lname"
                required
              />
            </div>
            <div class="input-container">
              <label for="email">Email*</label>
              <input
                class="input-field"
                v-model.trim="state.email"
                name="email"
                type="text"
                id="email"
                autocomplete="off"
                required
              />
            </div>
            <div class="input-container">
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
            <div class="input-container">
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
            <div class="input-container orcid-container row">
              <div class="col-sm-2 align-self-center">
                <span>ORCID</span>
              </div>
              <div class="col-sm-1">
                <img
                  alt="ORCID logo"
                  src="/ORCIDiD_iconvector.svg"
                  title="ORCID iD"
                  class="orcid-icon"
                />
              </div>
              <div class="col-sm-5 align-self-center">
                <span>{{ state.orcid }}</span>
              </div>
            </div>
            <div class="input-container checkbox-container">
              <input
                class="checkbox"
                v-model="state.accepted_terms_of_use"
                id="termsOfUseCheckbox"
                type="checkbox"
                name="accepted_terms_of_use"
                value="1"
                required
              />
              <b
                >I have read and accepted the
                <router-link to="/terms"
                  >Morphobank Terms of Use &amp; Privacy Policy</router-link
                ></b
              >
            </div>
            <Alert
              :message="error"
              messageName="signup"
              alertType="danger"
            ></Alert>
            <div v-if="error.showResetLink" class="mt-2 mb-2">
              <router-link
                :to="`/users/resetpassword?email=${state.email}`"
                class="btn btn-link p-0"
              >
                Reset your password
              </router-link>
            </div>
            <div>
              <button
                class="w-100 btn btn-lg btn-primary form-group"
                type="submit"
              >
                Register
              </button>
            </div>
          </div>
          <div class="input-container space-container"></div>
        </form>
      </div>
      <div class="col-md-6 d-flex align-items-center">
        <div class="registration-instructions">
          <h5>
            Registration is not required to view published projects. If you are
            interested in only viewing a project, please<br /><br />
            <router-link to="/projects/pub_date"
              >click to BROWSE published projects</router-link
            ><br /><br /><em>OR</em><br /><br />
            SEARCH published projects in the search box at the top of the page
          </h5>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import { getPasswordPattern, getPasswordRule } from '@/utils/util.js'
import router from '../../router'
import { apiService } from '@/services/apiService.js'
import Tooltip from '@/components/main/Tooltip.vue'
import Alert from '@/components/main/Alert.vue'

const authStore = useAuthStore()
const messageStore = useMessageStore()
const passwordTooltipText = getPasswordRule()
const confirmPasswordText = 'Please enter the password exactly as above.'
const orcidLoginUrl = ref(null)

const state = reactive({
  fname: '',
  lname: '',
  email: '',
  password: '',
  password2: '',
  accepted_terms_of_use: false,
  orcid: '',
  accessToken: '',
  refreshToken: '',
})
const error = reactive({
  signup: null,
  passwordValidation: null,
  passwordConfirm: null,
  showResetLink: false,
})

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

onMounted(async () => {
  orcidLoginUrl.value = await authStore.getOrcidLoginUrl()
  if (authStore.orcid.name) {
    let names = authStore.orcid.name.split(' ')
    state.fname = names[0]
    state.lname = names.slice(1).join(' ')
    state.orcid = authStore.orcid.orcid
    state.accessToken = authStore.orcid.accessToken
    state.refreshToken = authStore.orcid.refreshToken
  }
})

const submitForm = async () => {
  if (!validatePassword() || !confirmPassword()) return

  const formObject = {
    fname: state.fname,
    lname: state.lname,
    email: state.email,
    password: state.password,
    orcid: state.orcid,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    orcidWriteAccess: authStore.orcid.scope?.includes('/activities/update') || false,
  }

  try {
    const response = await apiService.post(authStore.getRegisterUrl(), formObject)
    if (response.ok) {
      messageStore.setSuccessMessage('User was created successfully!')
      router.push({ path: '/users/login' })
    } else {
      error.signup = 'An error occurred while creating user.'
      error.showResetLink = false
    }
  } catch (e) {
    console.log(e)
    if (e.message) {
      // Check if the error message indicates email already exists
      const errorMessage = e.message.toLowerCase()
      if (errorMessage.includes('email') && errorMessage.includes('reset')) {
        error.signup =
          'This email is already in our system. Please reset your password below instead of creating a new account.'
        error.showResetLink = true
      } else {
        error.signup = e.message
        error.showResetLink = false
      }
    } else {
      error.signup =
        'An error occurred while creating user. Please try again later.'
      error.showResetLink = false
    }
  }
}
</script>

<style scoped>
#registerForm {
  font-family: Arial, sans-serif;
  font-size: medium;
  color: #333;
  text-align: left;
  line-height: 1em;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
}

.space-container {
  height: 100px;
}

.orcid-container .col-sm-2.align-self-center span {
  align-items: center;
}

.checkbox-container {
  display: flex;
  align-items: center;
}

.checkbox {
  margin-right: 10px;
}

.orcid-icon {
  width: 30px;
  height: 30px;
}

.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.btn-white {
  background-color: #ffffff !important;
  border: 1px solid #ced4da !important;
  color: #333333;
}
</style>
