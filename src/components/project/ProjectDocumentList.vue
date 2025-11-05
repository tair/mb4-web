<script setup>
import { apiService } from '@/services/apiService.js'
import { buildDocumentUrl } from '@/utils/fileUtils.js'

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  documents: {
    type: Object,
    required: true,
  },
})

// Handle document downloads with proper authentication
async function handleDownload(doc) {
  try {
    // Use the S3 document URL (same as published projects)
    // This dynamically constructs the S3 path without needing stored s3_key
    const s3DocumentUrl = buildDocumentUrl(props.projectId, doc.document_id)
    
    const response = await apiService.get(s3DocumentUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch the document: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const contentType = response.headers.get('Content-Type')
    
    // Check if the content is viewable (images, pdf, text)
    if (
      contentType?.startsWith('image/') ||
      contentType?.startsWith('application/pdf') ||
      contentType?.startsWith('text/')
    ) {
      // Open viewable types in a new tab
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
    } else {
      // For other types, force download
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = doc.file_name || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    alert('Failed to download document. Please try again.')
  }
}
</script>
<template>
  <ul class="list-group">
    <li
      v-for="document in documents"
      :key="document.documentId"
      class="list-group-item"
    >
      <div class="list-group-item-header">
        <div class="list-group-item-name">
          {{ document.title }}
        </div>
        <div class="list-group-item-buttons">
          <button
            v-if="document.download_url"
            @click="handleDownload(document)"
            type="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Download"
          >
            <i class="fa fa-file-arrow-down"></i>
          </button>
          <RouterLink
            :to="`/myprojects/${projectId}/documents/${document.document_id}/edit`"
          >
            <button type="button" class="btn btn-sm btn-secondary">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </RouterLink>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="modal"
            data-bs-target="#documentDeleteModal"
            @click="$emit('update:deleteDocument', document)"
          >
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
      <div class="list-group-item-description">
        {{ document.description }}
      </div>
    </li>
  </ul>
</template>
<style scoped>
.list-group-item-header {
  display: flex;
}

.list-group-item-description {
  font-size: 95%;
  padding-left: 20px;
  padding-top: 5px;
}

.list-group-item-name {
  display: flex;
  flex-grow: 1;
}

.list-group-item-buttons {
  display: flex;
  gap: 7px;
}
</style>
