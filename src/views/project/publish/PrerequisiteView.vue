<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
const projectId = route.params.id

const isLoaded = ref(false)
const isValidating = ref(true) // Start with validating state
const validationComplete = ref(false)
const showValidationUI = ref(false) // Only show UI if validation fails
const currentValidationStep = ref('') // Track current validation step

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

// Group media validation issues by reason code for detailed display
const groupedMediaIssues = computed(() => {
  const items = validationStatus.value?.media?.incompleteMedia || []
  const counts = {}
  for (const item of items) {
    const reasons = Array.isArray(item?.reasons)
      ? item.reasons
      : [item?.reason || 'other']
    for (const r of reasons) {
      const reason = r || 'other'
      counts[reason] = (counts[reason] || 0) + 1
    }
  }
  return Object.keys(counts).map((reason) => ({
    reason,
    count: counts[reason],
  }))
})

function humanizeReason(reason) {
  switch (reason) {
    case 'missing_specimen':
      return 'Missing specimen information'
    case 'missing_view':
      return 'Missing view information'
    case 'missing_copyright_status':
      return 'Missing copyright status'
    case 'missing_copyright':
      return 'Missing copyright information'
    case 'missing_creator':
      return 'Missing creator/attribution information'
    case 'missing_date':
      return 'Missing creation date'
    case 'missing_caption':
      return 'Missing caption/description'
    case 'invalid_format':
      return 'Unsupported or invalid media format'
    case 'copyright_permission_not_requested':
      return 'Copyright permission not requested'
    default:
      return 'Other media validation issues'
  }
}

// Build a concise one-line summary for display
const mediaIssuesSummary = computed(() => {
  if (!groupedMediaIssues.value.length) return ''
  return groupedMediaIssues.value
    .map((grp) => `${humanizeReason(grp.reason)} (${grp.count})`)
    .join(', ')
})

// Prefer server-provided message; otherwise provide grammatically correct fallback
const mediaHeaderMessage = computed(() => {
  const firstError = validationStatus.value?.media?.errors?.[0]
  const firstWarning = validationStatus.value?.media?.warnings?.[0]
  if (firstError) return firstError
  if (firstWarning) return firstWarning
  const count = validationStatus.value?.media?.incompleteMedia?.length || 0
  return count === 1
    ? '1 media file has incomplete information:'
    : `${count} media files have incomplete information:`
})

onMounted(async () => {
  // Reset workflow when starting
  publishStore.resetWorkflow()
  publishStore.setCurrentStep('validation')

  // Initialize validation step
  currentValidationStep.value = 'Starting validation...'

  // Auto-run validations on load
  await runValidations()

  // If everything is valid, redirect immediately
  if (publishStore.canProceedToPreferences) {
    proceedToPreferences()
    return
  }

  // Only show validation UI if there are issues
  showValidationUI.value = true
  isLoaded.value = true
})

async function runValidations() {
  isValidating.value = true
  validationComplete.value = false

  try {
    // Run individual validations with progress updates
    currentValidationStep.value = 'Validating citation information...'
    await publishStore.validateCitations(projectId)

    currentValidationStep.value = 'Validating media files...'
    await publishStore.validateMedia(projectId)

    currentValidationStep.value = 'Finalizing validation...'
    validationComplete.value = true

    // If validation passes after re-run, redirect immediately
    if (publishStore.canProceedToPreferences) {
      proceedToPreferences()
      return
    }
  } catch (error) {
    console.error('Validation failed:', error)
    currentValidationStep.value = 'Validation error occurred'
  } finally {
    isValidating.value = false
  }
}

// Removed watch - immediate redirect is handled in runValidations

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
    <!-- Validating Loading Screen -->
    <div v-if="isValidating && !showValidationUI" class="validating-screen">
      <div class="validating-content">
        <div class="validating-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <h2>Validating Project</h2>
        <p>{{ currentValidationStep || 'Preparing validation...' }}</p>
      </div>
    </div>

    <!-- Validation Results UI (only shown if there are issues) -->
    <div v-else-if="showValidationUI" id="formArea" class="publish-validation">
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
            <div v-if="groupedMediaIssues.length > 0" class="info-message">
              <div style="margin-bottom: 6px">{{ mediaHeaderMessage }}</div>
              <ul style="margin: 0 0 8px 18px">
                <li v-for="grp in groupedMediaIssues" :key="grp.reason">
                  {{ humanizeReason(grp.reason) }} ({{ grp.count }})
                </li>
              </ul>
            </div>
            <template v-else>
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
            </template>
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
          v-if="!isValidating"
          @click="runValidations"
          class="btn btn-secondary"
        >
          Re-run Validation
        </button>

        <div v-if="isValidating" class="validating-inline">
          <i class="fa-solid fa-spinner fa-spin"></i>
          {{ currentValidationStep }}
        </div>

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
/* Validating Screen Styles */
.validating-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.validating-content {
  text-align: center;
  max-width: 400px;
}

.validating-spinner {
  margin-bottom: 20px;
}

.validating-spinner i {
  font-size: 48px;
  color: #007bff;
}

.validating-screen h2 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 24px;
}

.validating-screen p {
  color: #666;
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

.validating-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #007bff;
  font-size: 14px;
  margin: 10px 0;
}

.validating-inline i {
  font-size: 16px;
}

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

.success-message {
  color: #155724;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
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
