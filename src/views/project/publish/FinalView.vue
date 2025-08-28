<script setup>
import { onMounted, ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import UnpublishedItemsNotice from '@/components/project/UnpublishedItemsNotice.vue'
import PublishedSuccessView from '@/views/project/publish/PublishedSuccessView.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
const projectId = route.params.id

const isLoaded = ref(false)
const isPublishing = ref(false)
const errorMessage = ref(null)
const successMessage = ref(null)
const publishingComplete = ref(false)
const publicationResult = ref(null)

// Use store-backed unpublished items
const unpublishedItems = computed(() => publishStore.unpublishedItems)

// Mock data for media not in matrix (when matrix-only publishing is enabled)
const mediaNotInMatrix = reactive([
  { id: 789, type: 'media' },
  { id: 890, type: 'media' },
])

onMounted(async () => {
  // Check if we can access this step
  if (!publishStore.canProceedToFinal) {
    router.push(`/myprojects/${projectId}/publish`)
    return
  }

  publishStore.setCurrentStep('final')

  // Ensure unpublished items are loaded for display
  try {
    const u = publishStore.unpublishedItems
    const missingUnpublished = [
      u?.documents?.length,
      u?.folios?.length,
      u?.matrices?.length,
      u?.media?.length,
    ].every((n) => !n || n === 0)
    if (missingUnpublished) {
      await publishStore.loadUnpublishedItems(projectId)
    }
  } catch (e) {
    // Best-effort only; ignore errors
  }

  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  isLoaded.value = true
})

function editItem(id, type) {
  const routes = {
    media: `/myprojects/${projectId}/media/${id}`,
    document: `/myprojects/${projectId}/documents/${id}`,
    matrix: `/myprojects/${projectId}/matrices/${id}`,
    folio: `/myprojects/${projectId}/folios/${id}`,
  }
  router.push(routes[type])
}

async function publishProject() {
  // Clear previous messages
  errorMessage.value = null
  successMessage.value = null
  isPublishing.value = true

  try {
    // Perform publishing
    const result = await publishStore.publishProject(projectId)

    if (result.success) {
      successMessage.value = 'Project published successfully!'
      publishingComplete.value = true
      publicationResult.value = result

      // Update store step to final for completion
      publishStore.setCurrentStep('final')
    } else {
      errorMessage.value = result.message || 'Publishing failed: Unknown error'
    }
  } catch (error) {
    console.error('Error publishing project:', error)
    errorMessage.value =
      'An error occurred during publishing. Please try again.'
  } finally {
    isPublishing.value = false
  }
}

function handleReturnToOverview() {
  router.push(`/myprojects/${projectId}/overview`)
}

function handleViewPublishedProject(publishedProjectId) {
  router.push(`/project/${publishedProjectId}/overview`)
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-final">
      <!-- Publishing Completed Successfully -->
      <PublishedSuccessView
        v-if="publishingComplete"
        :publication-result="publicationResult"
        @return-to-overview="handleReturnToOverview"
        @view-published-project="handleViewPublishedProject"
      />

      <!-- Publishing Interface -->
      <div v-else class="publishing-interface">
        <div class="publish-intro">
          <div class="warning-notice">
            <i class="fa-solid fa-exclamation-triangle warning-icon"></i>
            <p>
              <strong>Important:</strong> You are about to publish your project
              on MorphoBank - please be sure you have made all the changes you
              wish to make because publishing on MorphoBank means that changes
              to the project can no longer be made. If you wish to build on a
              project that is published, click the "Request project duplication"
              link on the project overview page to request to have the project
              duplicated.
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          <i class="fa-solid fa-exclamation-triangle me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- Primary Action Button (centered) -->
        <div class="publish-actions">
          <button
            @click="publishProject"
            class="btn btn-success btn-large"
            :disabled="isPublishing && !errorMessage"
          >
            <template v-if="isPublishing && !errorMessage">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Publishing Project...
            </template>
            <template v-else>
              <i class="fa-solid fa-rocket"></i>
              Publish Project
            </template>
          </button>
        </div>

        <!-- Secondary Action Buttons (smaller, on separate row) -->
        <div class="secondary-actions">
          <button
            @click="
              router.push(
                `/myprojects/${projectId}/publish/preferences?from=final`
              )
            "
            class="btn btn-primary"
          >
            Update Publishing Preferences
          </button>

          <button
            @click="router.push(`/myprojects/${projectId}/overview`)"
            class="btn btn-secondary"
          >
            Return to Project Overview
          </button>
        </div>

        <!-- Matrix Media Only Warning (if applicable) -->
        <div
          v-if="publishStore.preferences.publishMatrixMediaOnly"
          class="info-box"
        >
          <b>Please Note:</b> You have chosen to only publish media in use in a
          matrix. Due to this, the following media will NOT be published:
          <div style="padding: 10px 0px 30px 20px">
            <template
              v-for="(media, index) in mediaNotInMatrix"
              :key="media.id"
            >
              <a
                href="#"
                @click="editItem(media.id, 'media')"
                class="text-primary"
                >M{{ media.id }}</a
              >
              <span v-if="index < mediaNotInMatrix.length - 1">, </span>
            </template>
          </div>
        </div>

        <!-- Unpublished Items Section -->
        <UnpublishedItemsNotice
          :unpublished-items="unpublishedItems"
          :project-id="projectId"
        />
      </div>

      <!-- Publishing Status -->
      <div v-if="isPublishing && !errorMessage" class="publishing-status mt-3">
        <div class="alert alert-info">
          <i class="fa-solid fa-clock"></i>
          <strong>Publishing in progress...</strong>
          <p class="mb-0">
            Please do not close this window. This process may take a few
            minutes.
          </p>
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

/* Publishing success styles moved to PublishedSuccessView component */

/* Publishing Interface Styles */
.publishing-interface {
  max-width: 800px;
  margin: 0 auto;
}

.publishing-interface h2 {
  color: #333;
  text-align: center;
  margin-bottom: 25px;
}

.publish-intro {
  margin-bottom: 30px;
}

.publish-intro p {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.warning-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.warning-icon {
  color: #856404;
  font-size: 18px;
  margin-top: 2px;
}

.warning-notice p {
  margin: 0;
  color: #856404;
  font-size: 14px;
  line-height: 1.5;
}

.publish-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}

.secondary-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 15px;
  flex-wrap: wrap;
}

/* Button Styles */
.btn {
  display: inline-block;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
  min-width: 180px;
}

.btn-large {
  padding: 15px 30px;
  font-size: 18px;
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
  color: #fff;
  text-decoration: none;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
  color: #fff;
  text-decoration: none;
}

.btn-success {
  color: #fff;
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
  color: #fff;
  text-decoration: none;
}

.btn:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.65;
}

/* Alert Styles */
.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.me-2 {
  margin-right: 0.5rem;
}

.info-box {
  margin: 10px 0px 10px 0px;
  padding: 10px;
  border: 2px solid #ededed;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .publish-actions,
  .secondary-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    min-width: 250px;
  }
}
</style>
