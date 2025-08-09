<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
const projectId = route.params.id

const isLoaded = ref(false)
const isValidating = ref(false)
const citationMessage = ref('Your project has incomplete citation information.')

onMounted(async () => {
  // Reset workflow when starting
  publishStore.resetWorkflow()
  publishStore.setCurrentStep('prerequisite')

  // Auto-validate on load
  await validateCitations()
  isLoaded.value = true
})

async function validateCitations() {
  isValidating.value = true
  const result = await publishStore.validateCitations(projectId)

  // Set appropriate message based on validation result
  if (!result.isValid && result.errors.length > 0) {
    citationMessage.value = result.errors.join(' ')
  }

  isValidating.value = false
  return result
}

function goToProjectInfo() {
  // Navigate to project edit page
  router.push(`/myprojects/${projectId}/edit`)
}

function proceedToNext() {
  router.push(`/myprojects/${projectId}/publish/media-validation`)
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-prerequisite">
      <p>
        Are you sure? Your paper must be in press or published in a
        peer-reviewed journal to proceed. If you want to share data while the
        paper is in review - this is easy to do - please see
        <a href="#" class="text-primary">online manual</a> or
        <a href="#" class="text-primary">FAQ page</a>.
      </p>

      <div
        v-if="!publishStore.validations.citations.isValid && !isValidating"
        class="citation-errors"
      >
        <p>
          <b
            >{{ citationMessage }} Please use the link below to enter the
            article information on the project information form.</b
          >
        </p>

        <div class="text-center my-4">
          <button @click="goToProjectInfo" class="large orange morphobutton">
            Edit Project Information &raquo;
          </button>
        </div>
      </div>

      <div
        v-if="publishStore.validations.citations.isValid"
        class="citation-success"
      >
        <div class="alert alert-success">
          <p class="mb-0">
            <i class="fa-solid fa-check-circle"></i>
            <strong>Citation information is complete.</strong> You can proceed
            to the next step.
          </p>
        </div>

        <div class="text-center my-4">
          <button @click="proceedToNext" class="large orange morphobutton">
            Continue to Media Validation &raquo;
          </button>
        </div>
      </div>

      <!-- Always show validation button -->
      <div class="text-center my-3">
        <button
          @click="validateCitations"
          class="btn btn-primary"
          :disabled="isValidating"
        >
          <i v-if="isValidating" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-sync"></i>
          {{ isValidating ? 'Validating...' : 'Check Citation Information' }}
        </button>
      </div>

      <!-- Navigation -->
      <div class="workflow-navigation mt-4">
        <button
          @click="router.push(`/myprojects/${projectId}/overview`)"
          class="btn btn-outline-secondary"
        >
          <i class="fa-solid fa-arrow-left"></i>
          Cancel
        </button>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
#formArea {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.citation-errors {
  margin: 20px 0;
}

.citation-success {
  margin: 20px 0;
}

.large.orange.morphobutton {
  background-color: var(--mb-orange);
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  text-decoration: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.large.orange.morphobutton:hover {
  background-color: var(--mb-orange-hover);
  color: white;
}

.workflow-navigation {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.text-primary {
  color: #007bff;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>
