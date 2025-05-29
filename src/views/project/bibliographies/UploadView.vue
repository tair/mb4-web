<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const projectId = parseInt(route.params.id)
const bibliographiesStore = useBibliographiesStore()

const file = ref(null)
const isUploading = ref(false)

async function uploadBibliography(event) {
  event.preventDefault()
  if (!file.value) {
    alert('Please select a file to upload')
    return
  }

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file.value)

  try {
    const importInfo = await bibliographiesStore.upload(projectId, formData)

    if (importInfo) {
      // Show import statistics
      const message =
        `Import completed:\n` +
        `- ${importInfo.import_count} new records imported\n` +
        `- ${importInfo.update_count} records updated\n` +
        `- ${importInfo.error_count} errors encountered`

      alert(message)

      if (importInfo.error_count === 0) {
        router.push({ name: 'MyProjectBibliographyListView' })
      }
    } else {
      alert('Failed to upload bibliography file')
    }
  } catch (error) {
    alert('Error uploading file: ' + error.message)
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="true">
    <div class="setup-content">
      <div class="mb-3">
        <RouterLink
          :to="{ name: 'MyProjectBibliographyListView' }"
          class="text-decoration-none"
        >
          <i class="fa-solid fa-arrow-left"></i> Back to Bibliography
        </RouterLink>
      </div>

      <h4>EndNote XML-format Bibliography Import</h4>

      <div class="form-group">
        <p>
          You can import bibliographic references created using
          <a href="http://www.endnote.com" target="_blank" rel="noopener"
            >EndNote</a
          >
          into your MorphoBank project. Simply save your EndNote data in the
          EndNote
          <strong>XML format</strong> and upload the file into your project
          using this form.
        </p>

        <p>
          Note that the file must be in the EndNote XML format. Other formats
          are proprietary to EndNote and not supported.
        </p>

        <div class="mt-3">
          <h5>Supported EndNote XML Fields:</h5>
          <div class="row">
            <div class="col-md-4">
              <ul>
                <li>Article Title</li>
                <li>Secondary Title</li>
                <li>Journal Title</li>
                <li>Authors</li>
                <li>Secondary Authors</li>
                <li>Author Address</li>
                <li>Reference Type</li>
              </ul>
            </div>
            <div class="col-md-4">
              <ul>
                <li>Electronic Resource Number</li>
                <li>Language</li>
                <li>Work Type</li>
                <li>Volume and Number</li>
                <li>Publication Year</li>
                <li>Publisher and Location</li>
              </ul>
            </div>
            <div class="col-md-4">
              <ul>
                <li>Pages</li>
                <li>ISBN</li>
                <li>Abstract</li>
                <li>Edition</li>
                <li>Section</li>
                <li>URLs</li>
                <li>Keywords</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form @submit.prevent="uploadBibliography">
        <div class="form-group">
          <label for="file" class="form-label">
            Choose an Endnote XML format file
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept=".xml"
            @change="(e) => (file = e.target.files[0])"
            class="form-control"
          />
        </div>

        <div class="mt-3">
          <b>Note:</b> Large batches can take a few minutes to process. Be
          patient!
        </div>

        <div class="btn-form-group">
          <RouterLink :to="{ name: 'MyProjectBibliographyListView' }">
            <button type="button" class="btn btn-outline-primary">
              Cancel
            </button>
          </RouterLink>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isUploading || !file"
          >
            {{ isUploading ? 'Uploading...' : 'Upload EndNote Data' }}
          </button>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';

.form-text {
  margin-top: 20px;
  color: #666;
  font-style: italic;
}
</style>
