<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
const projectId = route.params.id

const isLoaded = ref(false)
const isValidating = ref(false)
const validationComplete = ref(false)

const validationStatus = computed(() => {
  try {
    return (
      publishStore.getValidationStatus || {
        citations: {
          isValid: false,
          hasErrors: false,
          errors: [],
          warnings: [],
        },
        media: {
          isValid: false,
          hasErrors: false,
          hasWarnings: false,
          errors: [],
          warnings: [],
          hasMedia: false,
          incompleteMedia: [],
        },
      }
    )
  } catch (error) {
    console.error('Error accessing validation status:', error)
    return {
      citations: { isValid: false, hasErrors: false, errors: [], warnings: [] },
      media: {
        isValid: false,
        hasErrors: false,
        hasWarnings: false,
        errors: [],
        warnings: [],
        hasMedia: false,
        incompleteMedia: [],
      },
    }
  }
})
const canProceed = computed(() => publishStore.canProceedToPreferences)

onMounted(async () => {
  // Reset workflow when starting
  publishStore.resetWorkflow()
  publishStore.setCurrentStep('validation')

  // Auto-run validations on load
  await runValidations()

  isLoaded.value = true
})

async function runValidations() {
  isValidating.value = true
  validationComplete.value = false

  try {
    // Run individual validations - these methods we know work
    await publishStore.validateCitations(projectId)
    await publishStore.validateMedia(projectId)
    validationComplete.value = true
  } catch (error) {
    console.error('Validation failed:', error)
  } finally {
    isValidating.value = false
  }
}

function goToProjectInfo() {
  // Navigate to project edit page
  router.push(`/myprojects/${projectId}/edit`)
}

function goToMediaManagement() {
  // Navigate to media management page
  router.push(`/myprojects/${projectId}/media`)
}

function proceedToPreferences() {
  router.push(`/myprojects/${projectId}/publish/preferences`)
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-validation">
      <h2>Publishing Validation</h2>

      <p class="intro-text">
        Before publishing your project, we need to validate that all required
        information is complete. This includes citation information and media
        validation.
      </p>

      <!-- Validation Progress -->
      <div class="validation-section">
        <h3>Validation Progress</h3>

        <!-- Citations Validation -->
        <div class="validation-item">
          <div class="validation-header">
            <h4>
              <span class="validation-icon">
                <span v-if="isValidating" class="loading-spinner">⏳</span>
                <span
                  v-else-if="validationStatus?.citations?.isValid"
                  class="success-icon"
                  >✅</span
                >
                <span v-else class="error-icon">❌</span>
              </span>
              Citation Information
            </h4>
            <span class="validation-status">
              <span v-if="isValidating" class="status-validating"
                >Validating...</span
              >
              <span
                v-else-if="validationStatus?.citations?.isValid"
                class="status-valid"
                >Complete</span
              >
              <span v-else class="status-invalid">Incomplete</span>
            </span>
          </div>

          <div
            v-if="validationStatus?.citations?.hasErrors"
            class="validation-details"
          >
            <div
              v-for="error in validationStatus?.citations?.errors || []"
              :key="error"
              class="error-message"
            >
              {{ error }}
            </div>
            <button @click="goToProjectInfo" class="btn btn-primary btn-small">
              Fix Citation Information
            </button>
          </div>
        </div>

        <!-- Media Validation -->
        <div class="validation-item">
          <div class="validation-header">
            <h4>
              <span class="validation-icon">
                <span v-if="isValidating" class="loading-spinner">⏳</span>
                <span
                  v-else-if="validationStatus?.media?.isValid"
                  class="success-icon"
                  >✅</span
                >
                <span v-else class="error-icon">❌</span>
              </span>
              Media Validation
            </h4>
            <span class="validation-status">
              <span v-if="isValidating" class="status-validating"
                >Validating...</span
              >
              <span
                v-else-if="validationStatus?.media?.isValid"
                class="status-valid"
                >Complete</span
              >
              <span v-else class="status-invalid">Issues Found</span>
            </span>
          </div>

          <div
            v-if="
              validationStatus?.media?.hasErrors ||
              validationStatus?.media?.hasWarnings
            "
            class="validation-details"
          >
            <div
              v-for="error in validationStatus?.media?.errors || []"
              :key="error"
              class="error-message"
            >
              {{ error }}
            </div>
            <div
              v-for="warning in validationStatus?.media?.warnings || []"
              :key="warning"
              class="warning-message"
            >
              {{ warning }}
            </div>
            <div
              v-if="validationStatus?.media?.incompleteMedia?.length > 0"
              class="info-message"
            >
              {{ validationStatus?.media?.incompleteMedia?.length }} media files
              have incomplete information.
            </div>
            <button
              @click="goToMediaManagement"
              class="btn btn-primary btn-small"
            >
              Manage Media Files
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          v-if="!isValidating && !validationComplete"
          @click="runValidations"
          class="btn btn-secondary"
        >
          Re-run Validation
        </button>

        <button
          v-if="canProceed"
          @click="proceedToPreferences"
          class="btn btn-success btn-large"
        >
          Continue to Publishing Preferences →
        </button>

        <div v-else-if="validationComplete" class="validation-incomplete">
          <p>Please resolve the validation issues above before proceeding.</p>
        </div>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
#formArea {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.publish-validation h2 {
  color: #333;
  margin-bottom: 10px;
}

.intro-text {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.5;
}

.validation-section {
  margin-bottom: 30px;
}

.validation-section h3 {
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}

.validation-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
}

.validation-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.validation-icon {
  font-size: 18px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.validation-status {
  font-weight: 600;
  font-size: 14px;
}

.status-validating {
  color: #ffc107;
}

.status-valid {
  color: #28a745;
}

.status-invalid {
  color: #dc3545;
}

.validation-details {
  padding: 15px 20px;
  background: #f8f9fa;
}

.error-message {
  color: #dc3545;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.warning-message {
  color: #856404;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.info-message {
  color: #0c5460;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
}

.action-buttons {
  text-align: center;
  margin: 30px 0;
}

.validation-incomplete {
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  margin: 5px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-large {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.btn-success {
  color: #fff;
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

.mt-4 {
  margin-top: 1.5rem;
}

.pt-4 {
  padding-top: 1.5rem;
}

.text-muted {
  color: #6c757d;
}
</style>
