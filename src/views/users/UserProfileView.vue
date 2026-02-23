<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import { getPasswordPattern, getPasswordRule } from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import FormLayout from '@/components/main/FormLayout.vue'
import AddInstitutionDialog from '@/components/dialogs/AddInstitutionDialog.vue'
import { Modal } from 'bootstrap'
import '@/assets/css/form.css'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const userStore = useUserStore()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const { showError, showSuccess, showWarning } = useNotifications()

const profileConfirmationRequired = ref(false)
const user = reactive({})
const userForm = reactive({})
const userData = reactive({
  user,
  userForm,
})
const hasUserInteracted = ref(false)
const orcidLoginUrl = ref(null)
const unlinkingOrcid = ref(false)
const searchTerm = ref(null)
const institutionList = ref([])
const searchLoading = ref(false)
const emailTooltipText =
  'The e-mail address of this user. The address will be used for all mail-based system notifications and alerts to this user'
const insititutionalTootipText =
  'Scientists on MorphoBank are often affiliated with more than one institution and those can be entered here. When you change institutions, your older, published projects will remain credited to the institution you belonged to at the time the paper was published on MorphoBank'
const independentResearcherTooltipText = 
  'Check this if you have no institutional affiliation. Any listed institutions will be immediately removed from the form and saved when you click Update.'
const passwordTooltipText = getPasswordRule()

onMounted(async () => {
  try {
    // Check if user was redirected here for profile confirmation
    if (route.query.confirm_profile === '1') {
      profileConfirmationRequired.value = true
      const message = route.query.message || 'Please confirm your profile details to continue accessing MorphoBank features.'
      showWarning('Profile Confirmation', message)
    } else {
      // Check profile confirmation status for informational purposes
      const confirmationStatus = await authStore.checkProfileConfirmation()
      if (confirmationStatus.profile_confirmation_required) {
        profileConfirmationRequired.value = true
        showWarning('Profile Confirmation', 'Your profile details need to be confirmed. Please update your profile to keep your information current.')
      }
    }
    
    // Show any message from messageStore
    const msg = messageStore.getMessage()
    if (msg) {
      const msgType = messageStore.getMessageType()
      if (msgType === 'success') {
        showSuccess(msg)
      } else if (msgType === 'danger' || msgType === 'error') {
        showError(msg)
      } else if (msgType === 'warning') {
        showWarning('', msg)
      }
    }
    
    orcidLoginUrl.value = await authStore.getOrcidLoginUrl()
    await userStore.fetchCurrentUser()
    userData.user = userStore.originalUser
    userData.userForm = userStore.userForm

  } catch (e) {
    showError('Error fetching user profile. Please try again later.')
    console.error('Error fetching current user:', e)
  }
})

onBeforeUnmount(() => {
  messageStore.clearMessage()
})

// Watch for changes to the independent researcher checkbox
watch(() => userData.userForm.isInstitutionUnaffiliated, (newValue) => {
  if (newValue) {
    // Clear institutions immediately when independent researcher is checked
    userData.userForm.institutions = []
  }
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
        showError('You must have at least one institutional affiliation or mark yourself as an independent researcher.')
        return
      }
    }
    
    await userStore.updateUser()
    showSuccess('Update of user profile succeeded!')
    
    // Reset interaction tracking after successful update
    hasUserInteracted.value = false
    
    // Clear profile confirmation flag if it was set
    if (profileConfirmationRequired.value) {
      profileConfirmationRequired.value = false
    }
  } catch (e) {
    showError('Error updating user profile.')
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
    const response = await apiService.get('/users/search-institutions', {
      params: { searchTerm: searchTerm.value }
    })
    const data = await response.json()
    institutionList.value = data
    searchLoading.value = false
  } catch (err) {
    showError('Error loading institutions')
    console.error(err)
    searchLoading.value = false
  }
}

const unlinkORCID = async () => {
  if (!confirm('Are you sure you want to unlink your ORCID? You can link it again later.')) {
    return
  }
  
  try {
    unlinkingOrcid.value = true
    const result = await authStore.unlinkORCID()
    
    if (result.success) {
      userData.user.orcid = null
      userData.user.orcidWriteAccess = false
      userData.user.orcidWriteAccessRequired = false
      showSuccess('ORCID successfully unlinked from your account')
    } else {
      showError(result.message || 'Failed to unlink ORCID')
    }
  } catch (e) {
    showError('Error unlinking ORCID')
    console.error('Error unlinking ORCID:', e)
  } finally {
    unlinkingOrcid.value = false
  }
}

const removeInstitution = function (institutionId) {
  if (userData.userForm.institutions?.length <= 1 && !userData.userForm.isInstitutionUnaffiliated) {
    showError('The user must have at least one affiliated institution, or check "Independent Researcher, Unaffiliated"')
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

const addInstitution = function (institutionId, institutionName, active = 1) {
  // check if the institution already exists
  for (let i = 0; i < userData.userForm.institutions.length; i++) {
    const institution = userData.userForm.institutions[i]

    if (institution.institution_id === institutionId) {
      showError('The user already belongs to ' + institutionName)
      return // Exit after showing error
    }
  }
  // add the institution
  userData.userForm.institutions.push({
    institution_id: institutionId,
    name: institutionName,
    active: active,
  })
  
  // Automatically uncheck independent researcher when adding an institution
  if (userData.userForm.isInstitutionUnaffiliated) {
    userData.userForm.isInstitutionUnaffiliated = false
  }
  
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
    showError(getPasswordRule())
    return false
  } else {
    return true
  }
}

const confirmPassword = function () {
  if (
    (userData.userForm.newPasswordConfirm || userData.userForm.newPassword) &&
    userData.userForm.newPasswordConfirm != userData.userForm.newPassword
  ) {
    showError('Passwords do not match.')
    return false
  } else {
    return true
  }
}

// Track user interaction with form fields
const handleFieldFocus = () => {
  hasUserInteracted.value = true
}

// Open add institution dialog
const openAddInstitutionDialog = () => {
  const modalElement = document.getElementById('addInstitutionModal')
  const modal = new Modal(modalElement)
  modal.show()
}

// Handle institution creation from dialog
const handleInstitutionCreated = (institution) => {
  // Add the new institution to user's institutions
  if (!userData.userForm.institutions) {
    userData.userForm.institutions = []
  }
  
  userData.userForm.institutions.push({
    institution_id: institution.institution_id,
    name: institution.name,
    active: institution.active || 0,
    pendingApproval: institution.pendingApproval || institution.active === 0
  })
  
  // Automatically uncheck independent researcher when adding an institution
  if (userData.userForm.isInstitutionUnaffiliated) {
    userData.userForm.isInstitutionUnaffiliated = false
  }
  
  // Mark as interacted since we're modifying the form
  hasUserInteracted.value = true
  
  // Show success message with pending notice if applicable
  if (institution.pendingApproval || institution.active === 0) {
    showSuccess(`Institution "${institution.name}" has been submitted for approval and added to your profile.`)
  } else {
    showSuccess(`Institution "${institution.name}" has been added to your profile.`)
  }
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
    <div v-if="userForm">
      <form @submit.prevent="submitForm" class="list-form">
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
          />
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
          />
        </div>

        <!-- Institutional Affiliation Section -->
        <h2 class="section-heading">INSTITUTIONAL AFFILIATION</h2>
        <div class="section-dividing-line"></div>

        <div class="form-group">
          <label class="form-label">
            Current Affiliations
            <Tooltip :content="insititutionalTootipText"></Tooltip>
          </label>
          <ul class="institution-list">
            <li
              v-for="institution in userData.userForm.institutions"
              :key="institution.institution_id"
              class="institution-item"
            >
              {{ institution.name }}
              <span 
                v-if="institution.active === 0 || institution.active === false || institution.pendingApproval" 
                class="badge bg-warning text-dark ms-2"
                title="This institution is pending curator approval. It is currently only visible to you."
              >
                Pending Approval
              </span>
              <a
                href="#"
                class="removeLink"
                @click.prevent="removeInstitution(institution.institution_id)"
              >
                Remove
              </a>
            </li>
          </ul>
          <p v-if="userData.userForm.institutions?.some(i => i.active === 0 || i.active === false || i.pendingApproval)" class="small text-muted mt-2">
            <i class="fa fa-info-circle me-1"></i>
            Institutions marked as "Pending Approval" are awaiting curator review. They are currently only visible to you.
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Add New Institution
            <Tooltip :content="insititutionalTootipText"></Tooltip>
          </label>
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
                addInstitution(institution.institution_id, institution.name, institution.active)
              "
            >
              {{ institution.name }}{{ institution.active === 0 ? ' (Pending Approval)' : '' }}
            </option>
          </select>
          
          <!-- Add Institution Link -->
          <div class="mt-2">
            <a 
              href="#" 
              @click.prevent="openAddInstitutionDialog"
              class="text-primary"
              style="font-size: 0.9em;"
            >
              Can't find your institution? Add new institution
            </a>
          </div>
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
            <div v-else class="orcid-linked-container">
              <div v-if="userData.user.orcidWriteAccessRequired" class="alert alert-warning mb-3">
                <strong>Action Required:</strong> Your ORCID account is linked with read-only permission.
                To allow MorphoBank to add your published works to your ORCID record, please
                re-authenticate with write permission.
                <a :href="orcidLoginUrl" class="btn btn-sm btn-warning ms-2">
                  <img src="/ORCIDiD_iconvector.svg" class="orcid-icon" alt="ORCID" />
                  Grant Write Permission
                </a>
              </div>
              <div class="orcid-linked">
                <img
                  alt="ORCID logo"
                  src="/ORCIDiD_iconvector.svg"
                  title="ORCID iD"
                  class="orcid-icon"
                />
                <a 
                  :href="`https://orcid.org/${userData.user.orcid}`" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="orcid-link"
                >
                  {{ userData.user.orcid }}
                </a>
                <span v-if="userData.user.orcidWriteAccess" class="badge bg-success ms-2">Read &amp; Write</span>
                <span v-else class="badge bg-secondary ms-2">Read Only</span>
              </div>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-danger ms-3"
                @click="unlinkORCID"
                :disabled="unlinkingOrcid"
              >
                <span v-if="unlinkingOrcid">Unlinking...</span>
                <span v-else>Unlink ORCID</span>
              </button>
            </div>
          </div>
        </div>

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
    
    <!-- Add Institution Dialog -->
    <AddInstitutionDialog :onInstitutionCreated="handleInstitutionCreated" />
  </FormLayout>
</template>

<style scoped>
/* Remove all duplicate styles since we're using the shared form.css */
</style>
