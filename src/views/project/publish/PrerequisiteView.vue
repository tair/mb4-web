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
const citationMessage = ref('Your project has incomplete citation information.')

onMounted(async () => {
  // Reset workflow when starting
  publishStore.resetWorkflow()
  publishStore.setCurrentStep('prerequisite')

  // Auto-validate on load
  const result = await publishStore.validateCitations(projectId)
  console.log(result)

  // Set message from backend or use default
  if (result.errors && result.errors.length > 0) {
    citationMessage.value = result.errors[0]
  }

  isLoaded.value = true

  if (result.isValid) {
    router.push(`/myprojects/${projectId}/publish/media-validation`)
  }
})

function goToProjectInfo() {
  // Navigate to project edit page
  router.push(`/myprojects/${projectId}/edit`)
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

      <p>
        <b
          >{{ citationMessage }} Please use the link below to enter the article
          information on the project information form.</b
        >
      </p>

      <button @click="goToProjectInfo" class="large orange morphobutton">
        Edit Project Information &raquo;
      </button>

      <!-- Demo mode navigation -->
      <div class="demo-navigation mt-4 pt-4" style="border-top: 1px solid #ddd">
        <p class="text-muted">
          <small
            ><strong>Demo Mode:</strong> For testing purposes, you can proceed
            through the publishing workflow even with incomplete citation
            information.</small
          >
        </p>
        <button
          @click="
            router.push(`/myprojects/${projectId}/publish/media-validation`)
          "
          class="btn btn-secondary"
        >
          Continue with Demo Workflow &raquo;
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

.large.orange.morphobutton {
  background-color: #ff6600;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  text-decoration: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: inline-block;
}

.large.orange.morphobutton:hover {
  background-color: #e55a00;
  color: white;
}

.text-primary {
  color: #007bff;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
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

.btn {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  margin-bottom: 0;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  color: #fff;
  background-color: #5a6268;
  border-color: #545b62;
}
</style>
