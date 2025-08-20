<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import {
  logView,
  HIT_TYPES,
  logDownload,
  DOWNLOAD_TYPES,
} from '@/lib/analytics.js'

const route = useRoute()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const isDownloading = ref(false)

onMounted(() => {
  projectStore.fetchProject(projectId)
  // Track download page view
  // logView({ project_id: projectId, hit_type: HIT_TYPES.PROJECT })
})

async function downloadProject() {
  try {
    isDownloading.value = true
    const apiUrl = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/download/sdd?format=zip`

    // Make API call to get the ZIP file
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/zip',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get the blob data from the response
    const blob = await response.blob()

    // Create a blob URL and trigger download
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `project_${projectId}_sdd.zip`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl)

    // Log the download for analytics
    // logDownload({
    //   project_id: projectId,
    //   download_type: DOWNLOAD_TYPES.PROJECT || 'PROJECT',
    // })
  } catch (error) {
    console.error('Error downloading project:', error)
    alert('Error downloading project. Please try again.')
  } finally {
    isDownloading.value = false
  }
}
</script>
<template>
  <ProjectLoaderComp
    :key="projectId"
    :projectId="projectId"
    :isLoading="projectStore.isLoading"
    :errorMessage="
      projectStore.overview ? null : 'No project overview data available.'
    "
    basePath="project"
    itemName="overview"
  >
    <div class="download-section">
      <div class="download-button-container">
        <button
          @click="downloadProject"
          :disabled="isDownloading"
          class="btn btn-primary btn-download"
        >
          <i v-if="isDownloading" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-download"></i>
          {{ isDownloading ? 'Downloading...' : 'Download Project' }}
        </button>
      </div>

      <div class="download-info">
        <p>
          This tool downloads the entire project, all media, matrices and
          documents, as a zipped file. Please click on the menu to the left, if
          you only want a Matrix, certain Media or Documents.
        </p>
        <p>
          Media that have been released for 'one time use on MorphoBank only'
          will not be part of the download packet.
        </p>
        <p class="minor-text">
          The zipped archive has most project data formatted in an XML-format
          file conforming to the Structure of Descriptive Data (SDD) standard
          (<a
            href="http://wiki.tdwg.org/twiki/bin/view/SDD/WebHome"
            target="_blank"
            >http://wiki.tdwg.org/twiki/bin/view/SDD/WebHome</a
          >). See the MorphoBank manual for more information.
        </p>
      </div>
    </div>
  </ProjectLoaderComp>
</template>
<style>
.minor-text {
  color: #828282;
  font-size: 0.8rem;
}

.download-section {
  margin-top: 20px;
}

.download-button-container {
  text-align: center;
  margin-bottom: 30px;
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
