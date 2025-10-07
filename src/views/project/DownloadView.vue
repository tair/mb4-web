<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectStore = useProjectOverviewStore()
const projectId = route.params.id
const isDownloading = ref(false)
const downloadError = ref('')
const downloadSuccess = ref('')

onMounted(() => {
  projectStore.fetchProject(projectId)
})
async function downloadProject() {
  isDownloading.value = true
  downloadError.value = ''
  downloadSuccess.value = ''

  try {
    console.log('Downloading project:', projectId)
    const response = await apiService.get(
      `/projects/${projectId}/download/sdd?format=zip`,
      {
        headers: { Accept: 'application/zip' },
      }
    )

    if (!response.ok) {
      console.log('Download failed with status', response.status)
      let errorMessage = 'Download failed. '
      if (response.status === 404) {
        errorMessage += 'Project not found or not available for download.'
      } else if (response.status === 403) {
        errorMessage +=
          'Access denied. You may not have permission to download this project.'
      } else if (response.status >= 500) {
        errorMessage += 'Server error. Please try again later.'
      } else {
        errorMessage += `Server returned status ${response.status}.`
      }
      downloadError.value = errorMessage
      isDownloading.value = false
      return
    }

    console.log('Download successful')
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `project_${projectId}_sdd.zip`
    link.click()
    URL.revokeObjectURL(link.href)
    
    downloadSuccess.value = 'Project download completed successfully!'
    isDownloading.value = false
  } catch (error) {
    console.error('Download error:', error)
    downloadError.value = `Download failed: ${error.message}`
    isDownloading.value = false
  }
}
</script>
<template>
  <div v-if="projectStore.isLoading" class="text-center p-4">
    <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
    <p class="mt-2">Loading project...</p>
  </div>
  <div v-else-if="!projectStore.overview" class="alert alert-danger">
    No project overview data available.
  </div>
  <div v-else>
    <div class="download-component">
      <div class="download-section">
        <div v-if="downloadError" class="error-alert">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <span>{{ downloadError }}</span>
        </div>
        <div v-if="downloadSuccess" class="success-alert">
          <i class="fa-solid fa-check-circle"></i>
          <span>{{ downloadSuccess }}</span>
        </div>
        <div class="download-button-container">
          <button
            class="btn btn-primary btn-download"
            @click="downloadProject"
            :disabled="isDownloading"
          >
            <template v-if="isDownloading">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Downloading...
            </template>
            <template v-else>
              <i class="fa-solid fa-download"></i>
              Download Project
            </template>
          </button>
        </div>
      </div>
    </div>
    <div class="download-info">
      <p>
        This tool downloads the entire project, all media, matrices and
        documents, as a zipped file. Please click on the menu to the left, if
        you only want a Matrix, certain Media or Documents.
      </p>
      <p>
        Media that have been released for 'one time use on MorphoBank only' will
        not be part of the download packet.
      </p>
      <p class="minor-text">
        The zipped archive has most project data formatted in an XML-format file
        conforming to the Structure of Descriptive Data (SDD) standard (<a
          href="http://wiki.tdwg.org/twiki/bin/view/SDD/WebHome"
          target="_blank"
          >http://wiki.tdwg.org/twiki/bin/view/SDD/WebHome</a
        >). See the MorphoBank manual for more information.
      </p>
    </div>
  </div>
</template>
<style scoped>
.minor-text {
  color: #828282;
  font-size: 0.8rem;
}

.download-section {
  margin-top: 20px;
}

.download-button-container {
  text-align: center;
  margin-bottom: 12px;
}

.download-status {
  text-align: center;
  margin-bottom: 18px;
}

.error-alert {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-alert i {
  font-size: 1.2em;
}

.success-alert {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 12px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.success-alert i {
  font-size: 1.2em;
}

.btn-download {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
  min-width: 200px;
}

.btn {
  display: inline-block;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #0056b3;
  color: #fff;
  text-decoration: none;
}

.btn:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.65;
}

.download-info {
  max-width: 800px;
  margin: 0 auto;
}

.download-info p {
  line-height: 1.6;
  margin-bottom: 15px;
}

.fa-spinner {
  margin-right: 8px;
}
.fa-download {
  margin-right: 8px;
}
</style>
