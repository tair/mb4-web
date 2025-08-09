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

onMounted(async () => {
  // Check if we have publication results
  if (!publishStore.publicationResult.success) {
    router.push(`/myprojects/${projectId}/publish`)
    return
  }

  publishStore.setCurrentStep('confirmation')

  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  isLoaded.value = true
})

function goToPublishedProject() {
  // Navigate to the published project view
  const publishedId = publishStore.publicationResult.projectId.replace('P', '')
  window.open(`/project/${publishedId}/overview`, '_blank')
}

function goToMyProjects() {
  router.push('/myprojects')
}

function startNewPublication() {
  // Reset workflow and start over
  publishStore.resetWorkflow()
  router.push(`/myprojects/${projectId}/publish`)
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Could add a toast notification here
    alert('Copied to clipboard!')
  })
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-confirmation">
      <div class="confirmation-header">
        <div class="success-icon">
          <i class="fa-solid fa-check-circle"></i>
        </div>
        <h1>Project Published Successfully!</h1>
        <p class="lead">
          Your project has been published and is now available to the research
          community.
        </p>
      </div>

      <div class="publication-details">
        <div class="card mb-4">
          <div class="card-header">
            <h3>Publication Details</h3>
          </div>
          <div class="card-body">
            <div class="detail-row">
              <strong>Project ID:</strong>
              <span class="detail-value">
                {{ publishStore.publicationResult.projectId }}
                <button
                  @click="
                    copyToClipboard(publishStore.publicationResult.projectId)
                  "
                  class="btn btn-sm btn-outline-secondary ms-2"
                  title="Copy to clipboard"
                >
                  <i class="fa-solid fa-copy"></i>
                </button>
              </span>
            </div>

            <div class="detail-row">
              <strong>Public URL:</strong>
              <span class="detail-value">
                <a
                  :href="publishStore.publicationResult.publicUrl"
                  target="_blank"
                >
                  {{ publishStore.publicationResult.publicUrl }}
                </a>
                <button
                  @click="
                    copyToClipboard(publishStore.publicationResult.publicUrl)
                  "
                  class="btn btn-sm btn-outline-secondary ms-2"
                  title="Copy to clipboard"
                >
                  <i class="fa-solid fa-copy"></i>
                </button>
              </span>
            </div>

            <div class="detail-row">
              <strong>DOI:</strong>
              <span class="detail-value">
                {{ publishStore.publicationResult.doi }}
                <button
                  @click="copyToClipboard(publishStore.publicationResult.doi)"
                  class="btn btn-sm btn-outline-secondary ms-2"
                  title="Copy to clipboard"
                >
                  <i class="fa-solid fa-copy"></i>
                </button>
              </span>
            </div>

            <div class="detail-row">
              <strong>Publication Date:</strong>
              <span class="detail-value">
                {{ new Date().toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>Citation Information</h3>
          </div>
          <div class="card-body">
            <div class="citation-format">
              <h5>Recommended Citation:</h5>
              <div class="citation-text">
                [Authors] ({{ new Date().getFullYear() }}). [Project Title].
                MorphoBank. Project
                {{ publishStore.publicationResult.projectId }}.
                {{ publishStore.publicationResult.doi }}
              </div>
              <button
                @click="
                  copyToClipboard(
                    `[Authors] (${new Date().getFullYear()}). [Project Title]. MorphoBank. Project ${
                      publishStore.publicationResult.projectId
                    }. ${publishStore.publicationResult.doi}`
                  )
                "
                class="btn btn-outline-primary btn-sm mt-2"
              >
                <i class="fa-solid fa-copy"></i>
                Copy Citation
              </button>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>What's Next?</h3>
          </div>
          <div class="card-body">
            <h5>Immediate Actions:</h5>
            <ul>
              <li>✅ Confirmation email sent to your registered address</li>
              <li>✅ Project added to public MorphoBank catalog</li>
              <li>✅ DOI registered with appropriate authorities</li>
              <li>✅ Project collaborators notified (if selected)</li>
            </ul>

            <h5 class="mt-3">You can now:</h5>
            <ul>
              <li>Share your project URL with colleagues</li>
              <li>Include the DOI in your manuscript citations</li>
              <li>Update your project with supplementary data</li>
              <li>Monitor project usage and downloads</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="action-section">
        <div class="primary-actions">
          <button
            @click="goToPublishedProject"
            class="large orange morphobutton"
          >
            <i class="fa-solid fa-external-link-alt"></i>
            View Published Project
          </button>

          <button
            @click="goToMyProjects"
            class="large orange morphobutton"
            style="background-color: #6c757d"
          >
            <i class="fa-solid fa-home"></i>
            Return to My Projects
          </button>
        </div>

        <div class="secondary-actions mt-3">
          <button @click="window.print()" class="btn btn-outline-secondary">
            <i class="fa-solid fa-print"></i>
            Print Confirmation
          </button>
        </div>
      </div>

      <div class="additional-info">
        <div class="card">
          <div class="card-header">
            <h4>Support & Resources</h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h5>Need Help?</h5>
                <ul class="list-unstyled">
                  <li>
                    <a href="#" class="text-primary">
                      <i class="fa-solid fa-question-circle"></i>
                      Publication FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" class="text-primary">
                      <i class="fa-solid fa-envelope"></i>
                      Contact Support
                    </a>
                  </li>
                  <li>
                    <a href="#" class="text-primary">
                      <i class="fa-solid fa-book"></i>
                      User Guide
                    </a>
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <h5>Promote Your Research:</h5>
                <ul class="list-unstyled">
                  <li>
                    <a href="#" class="text-primary">
                      <i class="fa-brands fa-twitter"></i>
                      Share on Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" class="text-primary">
                      <i class="fa-brands fa-facebook"></i>
                      Share on Facebook
                    </a>
                  </li>
                  <li>
                    <a href="#" class="text-primary">
                      <i class="fa-brands fa-linkedin"></i>
                      Share on LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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
  margin: 0 10px;
}

.large.orange.morphobutton:hover {
  background-color: var(--mb-orange-hover);
  color: white;
}

.confirmation-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 2rem;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 1rem;
}

.confirmation-header h1 {
  color: #28a745;
  margin-bottom: 1rem;
}

.lead {
  font-size: 1.1rem;
  color: #6c757d;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-value {
  display: flex;
  align-items: center;
  font-family: monospace;
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.detail-value a {
  text-decoration: none;
}

.detail-value a:hover {
  text-decoration: underline;
}

.citation-format {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.citation-text {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.action-section {
  text-align: center;
  padding: 3rem 0;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.primary-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.secondary-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}

.additional-info {
  margin-top: 2rem;
}

.card-header {
  background-color: #f8f9fa;
}

.card-header h3,
.card-header h4 {
  margin-bottom: 0;
}

.list-unstyled li {
  margin-bottom: 0.5rem;
}

.list-unstyled a {
  text-decoration: none;
}

.list-unstyled a:hover {
  text-decoration: underline;
}

@media print {
  .action-section,
  .additional-info {
    display: none;
  }

  .confirmation-header {
    border-bottom: 2px solid #000;
  }

  .card {
    border: 1px solid #000;
    margin-bottom: 1rem;
  }
}
</style>
