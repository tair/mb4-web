<script setup>
import { onMounted, ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

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

// Mock data for unpublished items (same as preferences)
const unpublishedItems = reactive({
  media: [
    { id: 123, type: 'media' },
    { id: 456, type: 'media' },
  ],
  documents: [{ id: 1, title: 'Research Notes Document', type: 'document' }],
  matrices: [],
  folios: [],
})

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

  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  isLoaded.value = true
})

// const canPublish = computed(() => {
//   return publishStore.canPublish
// })

const hasUnpublishedItems = computed(() => {
  return (
    unpublishedItems.documents.length > 0 ||
    unpublishedItems.folios.length > 0 ||
    unpublishedItems.matrices.length > 0 ||
    unpublishedItems.media.length > 0
  )
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

function confirmAndPublish() {
  const confirmed = confirm(
    'You are about to publish your project on MorphoBank - please be sure you have made all the changes you wish to make because publishing on MorphoBank means that changes to the project can no longer be made. If you wish to build on a project that is published, click the "Request project duplication" link on the project overview page to request to have the project duplicated.'
  )

  if (confirmed) {
    publishProject()
  }
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

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000) // Convert from Unix timestamp
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-final">
      <!-- Publishing Completed Successfully -->
      <div v-if="publishingComplete" class="publication-success">
        <div class="success-header">
          <i class="fa-solid fa-check-circle success-icon"></i>
          <h2>Project Published Successfully!</h2>
        </div>

        <div class="success-details">
          <p>
            Your project has been successfully published and is now publicly
            available.
          </p>

          <div v-if="publicationResult" class="publication-info">
            <div class="info-item" v-if="publicationResult.projectId">
              <strong>Project ID:</strong> {{ publicationResult.projectId }}
            </div>
            <div class="info-item" v-if="publicationResult.publishedOn">
              <strong>Published On:</strong>
              {{ formatDate(publicationResult.publishedOn) }}
            </div>
            <div class="info-item" v-if="publicationResult.message">
              <strong>Status:</strong> {{ publicationResult.message }}
            </div>
          </div>
        </div>

        <div class="success-actions">
          <button
            @click="router.push(`/myprojects/${projectId}/overview`)"
            class="btn btn-primary btn-large"
          >
            Return to Project Overview
          </button>
          <button
            v-if="publicationResult?.projectId"
            @click="router.push(`/project/${publicationResult.projectId}`)"
            class="btn btn-secondary btn-large"
          >
            View Published Project
          </button>
        </div>
      </div>

      <!-- Publishing Interface -->
      <div v-else class="publishing-interface">
        <h2>Final Step: Publish Your Project</h2>

        <div class="publish-intro">
          <p>
            You're ready to publish your project! Please review the information
            below and confirm that you want to proceed with publication.
          </p>

          <div class="warning-notice">
            <i class="fa-solid fa-exclamation-triangle warning-icon"></i>
            <p>
              <strong>Important:</strong> Once published, your project cannot be
              modified. If you need to make changes after publication, you'll
              need to request project duplication to create a new version.
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          <i class="fa-solid fa-exclamation-triangle me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- Primary Action Buttons (centered) -->
        <div class="publish-actions">
          <button
            @click="confirmAndPublish"
            class="btn btn-success btn-large"
            :disabled="isPublishing"
          >
            <i v-if="isPublishing" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-rocket"></i>
            {{ isPublishing ? 'Publishing Project...' : 'Publish Project' }}
          </button>

          <button
            @click="router.push(`/myprojects/${projectId}/overview`)"
            class="btn btn-secondary btn-large"
          >
            Return to Project Overview
          </button>
        </div>
      </div>

      <!-- Matrix Media Only Warning (if applicable) -->
      <div
        v-if="publishStore.preferences.publishMatrixMediaOnly"
        class="info-box"
      >
        <b>Please Note:</b> You have chosen to only publish media in use in a
        matrix. Due to this, the following media will NOT be published:
        <div style="padding: 10px 0px 30px 20px">
          <template v-for="(media, index) in mediaNotInMatrix" :key="media.id">
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
      <div class="info-box">
        <b>Please Note:</b> <b>Individual</b> project documents, folios,
        matrices and media can be set to 'Never publish to project'.

        <template v-if="hasUnpublishedItems">
          The following items will <b>NOT</b> be published to your project:
          <div style="padding: 0px 0px 0px 20px">
            <!-- Documents -->
            <p v-if="unpublishedItems.documents.length > 0">
              <b
                >{{ unpublishedItems.documents.length }}
                {{
                  unpublishedItems.documents.length === 1
                    ? 'document'
                    : 'documents'
                }}:</b
              >
              <template
                v-for="(doc, index) in unpublishedItems.documents"
                :key="doc.id"
              >
                <a
                  href="#"
                  @click="editItem(doc.id, 'document')"
                  class="text-primary"
                  >{{ doc.title }}</a
                >
                <span v-if="index < unpublishedItems.documents.length - 1"
                  >,
                </span>
              </template>
            </p>

            <!-- Folios -->
            <p v-if="unpublishedItems.folios.length > 0">
              <b
                >{{ unpublishedItems.folios.length }}
                {{
                  unpublishedItems.folios.length === 1 ? 'folio' : 'folios'
                }}:</b
              >
              <template
                v-for="(folio, index) in unpublishedItems.folios"
                :key="folio.id"
              >
                <a
                  href="#"
                  @click="editItem(folio.id, 'folio')"
                  class="text-primary"
                  >{{ folio.name }}</a
                >
                <span v-if="index < unpublishedItems.folios.length - 1"
                  >,
                </span>
              </template>
            </p>

            <!-- Matrices -->
            <p v-if="unpublishedItems.matrices.length > 0">
              <b
                >{{ unpublishedItems.matrices.length }}
                {{
                  unpublishedItems.matrices.length === 1
                    ? 'matrix'
                    : 'matrices'
                }}:</b
              >
              <template
                v-for="(matrix, index) in unpublishedItems.matrices"
                :key="matrix.id"
              >
                <a
                  href="#"
                  @click="editItem(matrix.id, 'matrix')"
                  class="text-primary"
                  >{{ matrix.title }} (matrix {{ matrix.id }})</a
                >
                <span v-if="index < unpublishedItems.matrices.length - 1"
                  >,
                </span>
              </template>
            </p>

            <!-- Media -->
            <p v-if="unpublishedItems.media.length > 0">
              <b>{{ unpublishedItems.media.length }} media:</b>
              <template
                v-for="(media, index) in unpublishedItems.media"
                :key="media.id"
              >
                <a
                  href="#"
                  @click="editItem(media.id, 'media')"
                  class="text-primary"
                  >M{{ media.id }}</a
                >
                <span v-if="index < unpublishedItems.media.length - 1">, </span>
              </template>
            </p>
          </div>
        </template>

        <template v-else>
          <div style="padding: 0px 0px 0px 20px">
            <p>
              You have no individual items set to be blocked from publication.
            </p>
          </div>
        </template>
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

/* Publishing Success Styles */
.publication-success {
  text-align: center;
  padding: 40px 20px;
}

.success-header {
  margin-bottom: 30px;
}

.success-icon {
  font-size: 48px;
  color: #28a745;
  margin-bottom: 15px;
  display: block;
}

.success-header h2 {
  color: #333;
  margin: 0;
  font-size: 28px;
}

.success-details {
  margin-bottom: 40px;
}

.success-details p {
  font-size: 18px;
  color: #666;
  margin-bottom: 25px;
}

.publication-info {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.info-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.info-item strong {
  color: #333;
  margin-right: 8px;
}

.publication-link {
  color: #007bff;
  text-decoration: none;
  word-break: break-all;
}

.publication-link:hover {
  text-decoration: underline;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

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
  .success-actions,
  .publish-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    min-width: 250px;
  }
}
</style>
