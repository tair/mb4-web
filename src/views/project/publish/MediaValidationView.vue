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

const canProceed = computed(() => {
  // Allow proceeding even with no media or incomplete media (with warning)
  return publishStore.validations.citations.isValid
})

onMounted(async () => {
  // Check if we can access this step
  if (!publishStore.canProceedToMediaValidation) {
    router.push(`/myprojects/${projectId}/publish`)
    return
  }

  publishStore.setCurrentStep('media-validation')

  // Auto-validate media on mount
  await validateMedia()
  isLoaded.value = true
})

async function validateMedia() {
  isValidating.value = true
  await publishStore.validateMedia(projectId)
  isValidating.value = false
}

function proceedToPreferences() {
  router.push(`/myprojects/${projectId}/publish/preferences`)
}

function goToMediaManagement() {
  router.push(`/myprojects/${projectId}/media`)
}

function editMedia(mediaId) {
  router.push(`/myprojects/${projectId}/media/${mediaId}`)
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-media-validation">
      <!-- No Media Scenario -->
      <div
        v-if="!publishStore.validations.media.hasMedia && !isValidating"
        class="no-media-warning"
      >
        <div class="formError">
          <b>Warning:</b> Your project has no published media.
        </div>
        <br />
        <p>
          MorphoBank requires at least one image per project to help communicate
          science. Click here to add
          <a href="#" @click="goToMediaManagement" class="text-primary"
            >media</a
          >
          to your project. Be sure to add the
          <a href="#" class="text-primary">taxon</a> and
          <a href="#" class="text-primary">specimen</a> information first.
        </p>

        <div class="text-center my-4">
          <button
            @click="goToMediaManagement"
            class="large orange morphobutton"
          >
            Add Media
          </button>
        </div>
      </div>

      <!-- Incomplete Media Scenario -->
      <div
        v-else-if="
          publishStore.validations.media.incompleteMedia.length > 0 &&
          !isValidating
        "
        class="incomplete-media"
      >
        <p>
          <b
            >Your project contains
            {{ publishStore.validations.media.incompleteMedia.length }} media
            file{{
              publishStore.validations.media.incompleteMedia.length === 1
                ? ''
                : 's'
            }}
            with no specimen, no view, or whose Copyright Permission and/or
            Media Reuse License have not been finalized. You must finish
            cataloging
            {{
              publishStore.validations.media.incompleteMedia.length === 1
                ? 'this item'
                : 'these items'
            }}
            before you can publish your project:</b
          >
        </p>

        <div class="media-list">
          <template
            v-for="(media, index) in publishStore.validations.media
              .incompleteMedia"
            :key="media.id"
          >
            <a href="#" @click="editMedia(media.id)" class="button"
              >M{{ media.id }}</a
            >
            <span
              v-if="
                index <
                publishStore.validations.media.incompleteMedia.length - 1
              "
              >,
            </span>
          </template>
        </div>
      </div>

      <!-- Valid Media -->
      <div
        v-else-if="publishStore.validations.media.isValid && !isValidating"
        class="valid-media"
      >
        <div class="alert alert-success">
          <p class="mb-0">
            <i class="fa-solid fa-check-circle"></i>
            <strong>Media validation complete.</strong> All media files are
            ready for publication.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isValidating" class="text-center py-3">
        <i class="fa-solid fa-spinner fa-spin fa-2x text-primary"></i>
        <p class="mt-2">Validating media files...</p>
      </div>

      <!-- Navigation -->
      <div class="workflow-navigation mt-4">
        <button
          @click="router.push(`/myprojects/${projectId}/publish`)"
          class="btn btn-outline-secondary"
        >
          <i class="fa-solid fa-arrow-left"></i>
          Previous
        </button>

        <button
          @click="validateMedia"
          class="btn btn-primary"
          :disabled="isValidating"
        >
          <i v-if="isValidating" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-sync"></i>
          {{ isValidating ? 'Validating...' : 'Re-check Media' }}
        </button>

        <button
          @click="proceedToPreferences"
          class="large orange morphobutton"
          :disabled="!canProceed || isValidating"
        >
          Continue to Preferences &raquo;
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

.formError {
  color: #d32f2f;
  font-weight: bold;
  background-color: #ffebee;
  padding: 10px;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
}

.no-media-warning {
  margin: 20px 0;
}

.incomplete-media {
  margin: 20px 0;
}

.valid-media {
  margin: 20px 0;
}

.media-list {
  margin: 15px 0;
}

.button {
  background-color: #6c757d;
  color: white;
  padding: 5px 10px;
  text-decoration: none;
  border-radius: 3px;
  font-size: 12px;
  border: none;
  cursor: pointer;
}

.button:hover {
  background-color: #5a6268;
  color: white;
  text-decoration: none;
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

.large.orange.morphobutton:disabled {
  background-color: var(--mb-orange-disabled);
  cursor: not-allowed;
}

.workflow-navigation {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
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
