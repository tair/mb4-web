<script setup>
import axios from 'axios'
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import { getPasswordPattern, getPasswordRule } from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import Alert from '@/components/main/Alert.vue'
import FormLayout from '@/components/main/FormLayout.vue'
import '@/assets/css/form.css'

const userStore = useUserStore()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const errorMsg = reactive({
  message: messageStore.getMessage(),
})
const user = reactive({})
const userForm = reactive({})
const userData = reactive({
  user,
  userForm,
})
const error = reactive({})
const message = reactive({})
const orcidLoginUrl = ref(null)
const searchTerm = ref(null)
const institutionList = ref([])
const searchLoading = ref(false)
const emailTooltipText =
  'The e-mail address of this user. The address will be used for all mail-based system notifications and alerts to this user'
const insititutionalTootipText =
  'Scientists on MorphoBank are often affiliated with more than one institution and those can be entered here. When you change institutions, your older, published projects will remain credited to the institution you belonged to at the time the paper was published on MorphoBank'
const passwordTooltipText = getPasswordRule()

onMounted(async () => {
  try {
    orcidLoginUrl.value = await authStore.getOrcidLoginUrl()
    await userStore.fetchCurrentUser()
    userData.user = userStore.originalUser
    userData.userForm = userStore.userForm
  } catch (e) {
    error.fetchUser = 'Error fetching user profile. Please try again later.'
    console.error('Error fetching current user:', e)
  }
})

onBeforeUnmount(() => {
  messageStore.clearMessage()
})

const submitForm = async () => {
  try {
    if (!validatePassword() || !confirmPassword()) return
    await userStore.updateUser()
    message.updateUser = 'Update user profile succeed!'
  } catch (e) {
    error.updateUser = 'Error updating user profile.'
    console.error('Error updating user profile:', e)
  }
}

const searchInstitutions = async () => {
  if (searchTerm.value.trim() === '') {
    institutionList.value = []
    return
  }

  try {
    searchLoading.value = true
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/users/search-institutions`,
      {
        params: {
          searchTerm: searchTerm.value,
        },
      }
    )
    institutionList.value = response.data
    searchLoading.value = false
  } catch (error) {
    error.loadInstitutions = 'Error loading institutions'
    console.error(error)
  }
}

const removeInstitution = function (institutionId) {
  if (userData.userForm.institutions?.length <= 1) {
    error.removeInstitution =
      'The user must have at least one affiliated institutions'
  } else {
    for (let i = 0; i < userData.userForm.institutions.length; i++) {
      const institution = userData.userForm.institutions[i]

      if (institution.institution_id === institutionId) {
        // Remove the institution from the array
        userData.userForm.institutions.splice(i, 1)
        break // Exit the loop after removing the element
      }
    }
  }
}

const addInstitution = function (institutionId, institutionName) {
  // check if the institution already exists
  for (let i = 0; i < userData.userForm.institutions.length; i++) {
    const institution = userData.userForm.institutions[i]

    if (institution.institution_id === institutionId) {
      // Remove the institution from the array
      error.addInstitution = 'The user already belongs to ' + institutionName
      return // Exit the loop after removing the element
    }
  }
  // add the institution
  userData.userForm.institutions.push({
    institution_id: institutionId,
    name: institutionName,
  })
  // clear search box
  searchTerm.value = ''
  institutionList.value = []
}

// validate passwords
const validatePassword = function () {
  const newPasswordValidation = getPasswordPattern()
  if (
    userData.userForm.newPassword &&
    !newPasswordValidation.test(userData.userForm.newPassword)
  ) {
    error.newPasswordValidation = getPasswordRule()
    return false
  } else {
    error.newPasswordValidation = null
    return true
  }
}

const confirmPassword = function () {
  if (
    (userData.userForm.newPasswordConfirm || userData.userForm.newPassword) &&
    userData.userForm.newPasswordConfirm != userData.userForm.newPassword
  ) {
    error.newPasswordConfirm = 'Passwords do not match.'
    return false
  } else {
    error.newPasswordConfirm = null
    return true
  }
}
</script>

<template>
  <FormLayout title="USER PROFILE">
    <div v-if="!error.fetchUser && userForm">
      <form @submit.prevent="submitForm" class="list-form">
        <Alert
          :message="errorMsg"
          messageName="message"
          :alertType="messageStore.getMessageType()"
        ></Alert>

        <!-- Basic Information -->
        <div class="form-group">
          <label class="form-label"> First Name </label>
          <input
            type="text"
            class="form-control"
            v-model="userData.userForm.firstName"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label"> Last Name </label>
          <input
            type="text"
            class="form-control"
            v-model="userData.userForm.lastName"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Email
            <Tooltip :content="emailTooltipText"></Tooltip>
          </label>
          <input
            type="email"
            class="form-control"
            v-model="userData.userForm.email"
            required
          />
        </div>

        <!-- Password Section -->
        <h2 class="section-heading">PASSWORD</h2>
        <div class="section-dividing-line"></div>

        <div class="form-group">
          <label class="form-label">
            New Password
            <Tooltip :content="passwordTooltipText"></Tooltip>
          </label>
          <p class="field-description">
            Only enter a password if you wish to change your current password
          </p>
          <input
            type="password"
            autocomplete="new-password"
            class="form-control"
            v-model="userData.userForm.newPassword"
            @blur="validatePassword"
          />
          <Alert
            :message="error"
            messageName="newPasswordValidation"
            alertType="danger"
          ></Alert>
        </div>

        <div class="form-group">
          <label class="form-label">
            Confirm New Password
            <span class="required">Required</span>
          </label>
          <input
            type="password"
            autocomplete="new-password-confirm"
            class="form-control"
            v-model="userData.userForm.newPasswordConfirm"
            @blur="confirmPassword"
          />
          <Alert
            :message="error"
            messageName="newPasswordConfirm"
            alertType="danger"
          ></Alert>
        </div>

        <!-- Institutional Affiliation Section -->
        <h2 class="section-heading">INSTITUTIONAL AFFILIATION</h2>
        <div class="section-dividing-line"></div>

        <div class="form-group">
          <label class="form-label">
            Current Affiliations
            <Tooltip :content="insititutionalTootipText"></Tooltip>
          </label>
          <Alert
            :message="error"
            messageName="loadInstitutions"
            alertType="danger"
          ></Alert>
          <ul class="institution-list">
            <li
              v-for="institution in userData.userForm.institutions"
              :key="institution.institution_id"
              class="institution-item"
            >
              {{ institution.name }}
              <a
                href="#"
                class="removeLink"
                @click.prevent="removeInstitution(institution.institution_id)"
              >
                Remove
              </a>
            </li>
          </ul>
          <Alert
            :message="error"
            messageName="removeInstitution"
            alertType="danger"
          ></Alert>
        </div>

        <div class="form-group">
          <label class="form-label">
            Add New Institution
            <Tooltip :content="insititutionalTootipText"></Tooltip>
          </label>
          <Alert
            :message="error"
            messageName="addInstitution"
            alertType="danger"
          ></Alert>
          <div class="search-container">
            <input
              type="text"
              v-model="searchTerm"
              @input="searchInstitutions"
              class="form-control"
              placeholder="Search for institutions..."
            />
            <img
              class="loading-icon"
              alt="Loading spinner"
              src="/Loading_spinner.svg"
              title="Loading Spinner"
              v-if="searchLoading"
            />
          </div>
          <select v-if="institutionList.length" :size="10" class="form-control">
            <option
              v-for="institution in institutionList"
              :key="institution.institution_id"
              :value="institution.institution_id"
              @click="
                addInstitution(institution.institution_id, institution.name)
              "
            >
              {{ institution.name }}
            </option>
          </select>
        </div>

        <!-- ORCID Section -->
        <h2 class="section-heading">ORCID</h2>
        <div class="section-dividing-line"></div>

        <div class="form-group">
          <div class="orcid-container">
            <div v-if="!userData.user.orcid">
              <a :href="orcidLoginUrl" class="btn btn-lg btn-primary btn-white">
                <img
                  alt="ORCID logo"
                  src="/ORCIDiD_iconvector.svg"
                  class="orcid-icon"
                />
                Link Account with ORCID
              </a>
            </div>
            <div v-else class="orcid-linked">
              <img
                alt="ORCID logo"
                src="/ORCIDiD_iconvector.svg"
                title="ORCID iD"
                class="orcid-icon"
              />
              {{ userData.user.orcid }}
            </div>
          </div>
        </div>

        <Alert
          :message="error"
          messageName="updateUser"
          alertType="danger"
        ></Alert>
        <Alert
          :message="message"
          messageName="updateUser"
          alertType="success"
        ></Alert>

        <div class="form-buttons">
          <button class="btn btn-primary" type="submit">Update</button>
          <button
            class="btn btn-secondary"
            type="button"
            @click.prevent="userStore.reset()"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    <Alert :message="error" messageName="fetchUser" alertType="danger"></Alert>
  </FormLayout>
</template>

<style scoped>
/* Remove all duplicate styles since we're using the shared form.css */
</style>
