<script setup>
import { Modal } from 'bootstrap'
import { ref, nextTick } from 'vue'
import { apiService } from '@/services/apiService.js'

const props = defineProps({
  onInstitutionCreated: Function,
})

const searchTerm = ref('')
const institutionList = ref([])
const searchLoading = ref(false)
const errorMessage = ref('')
const hasError = ref(false)
const newInstitutionName = ref('')
const showCreateForm = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')

async function searchInstitutions() {
  if (searchTerm.value.trim() === '') {
    institutionList.value = []
    return
  }

  try {
    searchLoading.value = true
    hasError.value = false
    errorMessage.value = ''
    
    const response = await apiService.get('/users/search-institutions', { 
      params: { searchTerm: searchTerm.value }
    })
    const data = await response.json()
    institutionList.value = data
    
    // If no results found, show create form
    if (data.length === 0) {
      showCreateForm.value = true
      newInstitutionName.value = searchTerm.value
    } else {
      showCreateForm.value = false
    }
  } catch (error) {
    hasError.value = true
    errorMessage.value = 'Error searching institutions: ' + error.message
    console.error('Error searching institutions:', error)
  } finally {
    searchLoading.value = false
  }
}

function selectInstitution(institution) {
  if (props.onInstitutionCreated) {
    props.onInstitutionCreated(institution)
  }
  closeModal()
}

async function createInstitution() {
  if (!newInstitutionName.value.trim()) {
    hasError.value = true
    errorMessage.value = 'Please enter an institution name.'
    return
  }

  try {
    hasError.value = false
    errorMessage.value = ''
    
    const response = await apiService.post('/users/create-institution', {
      name: newInstitutionName.value.trim(),
    })
    const data = await response.json()
    
    // Show success message with pending approval notice
    showSuccessMessage.value = true
    successMessage.value = `"${data.institution.name}" has been submitted for approval. You can use it immediately, but it will only be visible to others once a curator approves it.`
    
    // Call the callback with the new institution (include pending status)
    if (props.onInstitutionCreated) {
      props.onInstitutionCreated({
        ...data.institution,
        pendingApproval: true
      })
    }
    
    // Close modal after a short delay so user sees the success message
    setTimeout(() => {
      closeModal()
    }, 3000)
  } catch (error) {
    hasError.value = true
    // Check if it's a conflict error (409) based on error message
    if (error.message && error.message.includes('409')) {
      errorMessage.value = 'Institution already exists. Please search for it above.'
    } else {
      errorMessage.value = 'Error creating institution: ' + error.message
    }
    console.error('Error creating institution:', error)
  }
}

function closeModal() {
  const element = document.getElementById('addInstitutionModal')
  const modal = Modal.getInstance(element)
  
  // Remove focus from any focused element inside the modal before hiding
  const focusedElement = element.querySelector(':focus')
  if (focusedElement && 'blur' in focusedElement) {
    focusedElement.blur()
  }
  
  modal.hide()
  resetForm()
}

function resetForm() {
  searchTerm.value = ''
  institutionList.value = []
  newInstitutionName.value = ''
  showCreateForm.value = false
  hasError.value = false
  errorMessage.value = ''
  searchLoading.value = false
  showSuccessMessage.value = false
  successMessage.value = ''
}

// Auto-focus search input when modal opens
function handleModalShown() {
  nextTick(() => {
    const searchInput = document.querySelector('#addInstitutionModal input[type="text"]')
    if (searchInput) {
      searchInput.focus()
    }
  })
}
</script>

<template>
  <div
    class="modal fade"
    id="addInstitutionModal"
    data-bs-backdrop="static"
    tabindex="-1"
    @shown.bs.modal="handleModalShown"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add New Institution</h5>
        </div>
        <div class="modal-body">
          <!-- Search Section -->
          <div class="form-group mb-3">
            <label class="form-label">Search for Institution</label>
            <p class="field-description text-muted small">
              First, search to see if your institution already exists in our database.
            </p>
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
          </div>

          <!-- Search Results -->
          <div v-if="institutionList.length > 0" class="form-group mb-3">
            <label class="form-label">Found Institutions</label>
            <select size="8" class="form-control">
              <option
                v-for="institution in institutionList"
                :key="institution.institution_id"
                :value="institution.institution_id"
                @click="selectInstitution(institution)"
                style="cursor: pointer;"
              >
                {{ institution.name }}
              </option>
            </select>
            <p class="field-description text-muted small mt-1">
              Click on an institution to select it.
            </p>
          </div>

          <!-- Create New Institution Form -->
          <div v-if="showCreateForm" class="form-group mb-3">
            <label class="form-label">Create New Institution</label>
            <p class="field-description text-muted small">
              No institutions found matching "{{ searchTerm }}". You can create a new one:
            </p>
            <input
              type="text"
              v-model="newInstitutionName"
              class="form-control"
              :class="{ 'is-invalid': hasError }"
              placeholder="Enter institution name"
            />
            <div v-if="hasError" class="invalid-feedback">
              {{ errorMessage }}
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="hasError && !showCreateForm" class="alert alert-danger">
            {{ errorMessage }}
          </div>
          
          <!-- Success Message with Pending Approval Notice -->
          <div v-if="showSuccessMessage" class="alert alert-success">
            <i class="fa fa-check-circle me-2"></i>
            <strong>Institution Created!</strong>
            <p class="mb-0 mt-2">{{ successMessage }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-primary"
            data-bs-dismiss="modal"
            @click="resetForm"
          >
            Cancel
          </button>
          <button
            v-if="showCreateForm"
            type="button"
            class="btn btn-primary"
            @click="createInstitution"
            :disabled="!newInstitutionName.trim()"
          >
            Create Institution
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
}

.loading-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
}

.invalid-feedback {
  display: block;
}

.field-description {
  margin-bottom: 8px;
}

option:hover {
  background-color: #007bff !important;
  color: white !important;
}
</style>
