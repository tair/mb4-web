<script setup>
import axios from 'axios'
import { reactive, ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import { getPasswordPattern, getPasswordRule } from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import Alert from '@/components/main/Alert.vue'
import FormLayout from '@/components/main/FormLayout.vue'
import '@/assets/css/form.css'

const route = useRoute()
const userStore = useUserStore()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const errorMsg = reactive({
  message: messageStore.getMessage(),
})
const profileConfirmationRequired = ref(false)
const user = reactive({})
const userForm = reactive({})
const userData = reactive({
  user,
  userForm,
})
const error = reactive({})
const message = reactive({})
const hasUserInteracted = ref(false)
const orcidLoginUrl = ref(null)
const searchTerm = ref(null)
const institutionList = ref([])
const searchLoading = ref(false)
const emailTooltipText =
  'The e-mail address of this user. The address will be used for all mail-based system notifications and alerts to this user'
const insititutionalTootipText =
  'Scientists on MorphoBank are often affiliated with more than one institution and those can be entered here. When you change institutions, your older, published projects will remain credited to the institution you belonged to at the time the paper was published on MorphoBank'
const independentResearcherTooltipText = 
  'Mark this if you are not affiliated with an institution. If you previously were affiliated with an institution, it will be removed when this form is saved.'
const passwordTooltipText = getPasswordRule()

onMounted(async () => {
  try {
    // Check if user was redirected here for profile confirmation
    if (route.query.confirm_profile === '1') {
      profileConfirmationRequired.value = true
      message.profileConfirmation = route.query.message || 'Please confirm your profile details to continue accessing MorphoBank features.'
    } else {
      // Check profile confirmation status for informational purposes
      const confirmationStatus = await authStore.checkProfileConfirmation()
      if (confirmationStatus.profile_confirmation_required) {
        profileConfirmationRequired.value = true
        message.profileConfirmation = 'Your profile details need to be confirmed. Please update your profile to keep your information current.'
      }
    }
    
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
    
    // Handle independent researcher logic
    if (userData.userForm.isInstitutionUnaffiliated) {
      // Clear all institutions if independent researcher is checked
      userData.userForm.institutions = []
    } else {
      // Validate that user has at least one institution if not independent
      if (!userData.userForm.institutions || userData.userForm.institutions.length === 0) {
        error.updateUser = 'You must have at least one institutional affiliation or mark yourself as an independent researcher.'
        return
      }
    }
    
    await userStore.updateUser()
    message.updateUser = 'Update user profile succeed!'
    
    // Reset interaction tracking after successful update
    hasUserInteracted.value = false
    
    // Clear profile confirmation flag if it was set
    if (profileConfirmationRequired.value) {
      profileConfirmationRequired.value = false
      message.profileConfirmation = null
    }
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
  if (userData.userForm.institutions?.length <= 1 && !userData.userForm.isInstitutionUnaffiliated) {
    error.removeInstitution =
      'The user must have at least one affiliated institution, or check "Independent Researcher, Unaffiliated"'
  } else {
    // Clear any previous remove institution error
    error.removeInstitution = null
    
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

// Track user interaction with form fields
const handleFieldFocus = () => {
  hasUserInteracted.value = true
}

// Computed button text
const submitButtonText = computed(() => {
  if (profileConfirmationRequired.value && !hasUserInteracted.value) {
    return 'Confirm'
  }
  return 'Update'
})
</script>

<template>
  <FormLayout title="USER PROFILE">
    <div v-if="!error.fetchUser && userForm">
      <!-- Profile Confirmation Alert -->
      <Alert
        v-if="profileConfirmationRequired"
        :message="message"
        messageName="profileConfirmation"
        alertType="warning"
      ></Alert>
      
      <form @submit.prevent="submitForm" class="list-form">
        <Alert
          :message="errorMsg"
          messageName="message"
          :alertType="messageStore.getMessageType()"
        ></Alert>
        
        <!-- Success Message for Profile Update -->
        <Alert
          :message="message"
          messageName="updateUser"
          alertType="success"
        ></Alert>

        <!-- Basic Information -->
        <div class="form-group">
          <label class="form-label"> First Name </label>
          <input
            type="text"
            class="form-control"
            v-model="userData.userForm.firstName"
            @focus="handleFieldFocus"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label"> Last Name </label>
          <input
            type="text"
            class="form-control"
            v-model="userData.userForm.lastName"
            @focus="handleFieldFocus"
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
            @focus="handleFieldFocus"
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
            @focus="handleFieldFocus"
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
            @focus="handleFieldFocus"
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
              @focus="handleFieldFocus"
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
          <select v-if="institutionList.length" :size="10" class="form-control" @focus="handleFieldFocus">
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

        <div class="form-group">
          <label class="form-label">
            <input
              type="checkbox"
              v-model="userData.userForm.isInstitutionUnaffiliated"
              @focus="handleFieldFocus"
              class="form-checkbox"
            />
            Independent Researcher, Unaffiliated
            <Tooltip :content="independentResearcherTooltipText"></Tooltip>
          </label>
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
          <button class="btn btn-primary" type="submit">
            {{ submitButtonText }}
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click.prevent="userStore.reset()"
          >
            Cancel
          </button>
          <small v-if="profileConfirmationRequired && !hasUserInteracted" class="text-muted ms-2">
            Click "Confirm" to validate your profile details
          </small>
        </div>
      </form>
    </div>
    <Alert :message="error" messageName="fetchUser" alertType="danger"></Alert>
  </FormLayout>
</template>

<style scoped>
/* Remove all duplicate styles since we're using the shared form.css */
</style>
