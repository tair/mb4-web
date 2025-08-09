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

const canPublish = computed(() => {
  return publishStore.canPublish
})

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
  if (!canPublish.value) {
    return
  }

  isPublishing.value = true

  try {
    // Perform publishing
    const result = await publishStore.publishProject(projectId)

    if (result.success) {
      // Navigate to confirmation page
      router.push(`/myprojects/${projectId}/publish/confirmation`)
    } else {
      alert('Publishing failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error publishing project:', error)
    alert('An error occurred during publishing. Please try again.')
  } finally {
    isPublishing.value = false
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-final">
      <!-- Primary Action Buttons (centered) -->
      <p style="text-align: center">
        <button
          @click="confirmAndPublish"
          class="large orange morphobutton"
          :disabled="!canPublish || isPublishing"
        >
          <i v-if="isPublishing" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-rocket"></i>
          {{
            isPublishing ? 'Publishing Project...' : 'Publish Project &raquo;'
          }}
        </button>

        <button
          @click="router.push(`/myprojects/${projectId}/overview`)"
          class="large orange morphobutton"
          style="margin-left: 25px"
        >
          Return to Project Overview Page &raquo;
        </button>
      </p>

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
      <div v-if="isPublishing" class="publishing-status mt-3">
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
  max-width: 1000px;
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
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.large.orange.morphobutton:hover {
  background-color: #e55a00;
  text-decoration: none;
  color: white;
}

.large.orange.morphobutton:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.info-box {
  margin: 10px 0px 10px 0px;
  padding: 10px;
  border: 2px solid #ededed;
}

.publishing-status {
  text-align: center;
}

.text-primary {
  color: #007bff;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.mt-3 {
  margin-top: 1rem;
}

.mb-0 {
  margin-bottom: 0;
}
</style>
