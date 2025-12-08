<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useNotifications } from '@/composables/useNotifications'
import { stacksSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import JSZip from 'jszip'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess } = useNotifications()
const isUploading = ref(false)

// Direct-to-S3 upload state
const uploadProgress = ref(0)
const uploadPhase = ref('') // 'initiating', 'uploading', 'processing'
const uploadSpeed = ref(0) // bytes per second
const estimatedTimeRemaining = ref(0) // seconds

// Threshold for using direct S3 upload (100MB) - smaller files use traditional upload
const DIRECT_UPLOAD_THRESHOLD = 100 * 1024 * 1024

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

function validateRequiredFields(formData) {
  const errors = []
  
  // Check required fields based on schema
  Object.entries(stacksSchema).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      const value = formData.get(fieldName)
      
      // Special handling for file uploads
      if (fieldName === 'file') {
        if (!value || (value instanceof File && value.size === 0)) {
          errors.push(`${fieldDef.label} is required`)
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${fieldDef.label} is required`)
      }
    }
  })
  
  // Conditional validation for copyright fields
  const copyrightCheckbox = formData.get('is_copyrighted')
  const isCopyrighted = copyrightCheckbox === '1' || copyrightCheckbox === 1
  
  if (isCopyrighted) {
    // Check copyright_permission - must not be the default "not set" option (value 0)
    const copyrightPermission = formData.get('copyright_permission')
    const copyrightPermissionValue = parseInt(String(copyrightPermission), 10)
    
    if (isNaN(copyrightPermissionValue) || copyrightPermissionValue === 0) {
      errors.push('Copyright permission must be selected when media is under copyright (cannot use "Copyright permission not set")')
    }
    
    // Validate that copyright_permission is not contradictory
    // Value 4 = "Copyright expired or work otherwise in public domain"
    if (copyrightPermissionValue === 4) {
      errors.push('Cannot select "Copyright expired or work otherwise in public domain" when media is under copyright')
    }
    
    // Check copyright_license - must not be the default "not set" option (value 0)
    const copyrightLicense = formData.get('copyright_license')
    const copyrightLicenseValue = parseInt(String(copyrightLicense), 10)
    
    if (isNaN(copyrightLicenseValue) || copyrightLicenseValue === 0) {
      errors.push('Media reuse license must be selected when media is under copyright (cannot use "Media reuse policy not set")')
    }
    
    // Validate that copyright_license is not contradictory
    // Value 1 = "CC0 - relinquish copyright"
    if (copyrightLicenseValue === 1) {
      errors.push('Cannot select "CC0 - relinquish copyright" when media is under copyright')
    }
  }
  
  return errors
}

/**
 * Upload file directly to S3 using presigned URL with progress tracking
 */
async function uploadToS3WithProgress(uploadUrl, file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const startTime = Date.now()
    let lastLoaded = 0
    let lastTime = startTime

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        // Calculate progress percentage
        uploadProgress.value = Math.round((event.loaded / event.total) * 100)

        // Calculate upload speed (bytes per second)
        const currentTime = Date.now()
        const timeDiff = (currentTime - lastTime) / 1000 // seconds
        if (timeDiff > 0.5) { // Update speed every 0.5 seconds
          const bytesDiff = event.loaded - lastLoaded
          uploadSpeed.value = Math.round(bytesDiff / timeDiff)
          lastLoaded = event.loaded
          lastTime = currentTime

          // Estimate remaining time
          if (uploadSpeed.value > 0) {
            const remainingBytes = event.total - event.loaded
            estimatedTimeRemaining.value = Math.round(remainingBytes / uploadSpeed.value)
          }
        }
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      // Check if this is a CORS error
      if (xhr.status === 0) {
        reject(new Error('CORS error: S3 bucket needs CORS configuration to allow uploads from this origin. Please contact your administrator.'))
      } else {
        reject(new Error(`Network error during S3 upload: ${xhr.statusText || 'Unknown error'}`))
      }
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'))
    })

    // Note: Don't set Content-Type header manually - let the browser set it
    // The presigned URL already includes Content-Type in the signature
    xhr.open('PUT', uploadUrl)
    // Only set Content-Type if it's not already in the URL signature
    // The presigned URL should handle Content-Type, but we set it to match
    xhr.setRequestHeader('Content-Type', 'application/zip')
    xhr.send(file)
  })
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Format seconds for display
 */
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

// Supported image extensions for thumbnail extraction
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'gif', 'bmp', 'webp']

/**
 * Extract the first image from a ZIP file in the browser.
 * This avoids downloading the entire ZIP on the backend for thumbnail generation.
 * 
 * @param {File} zipFile - The ZIP file to extract from
 * @returns {Promise<{blob: Blob, filename: string, mimetype: string} | null>}
 */
async function extractFirstImageFromZip(zipFile) {
  try {
    const zip = await JSZip.loadAsync(zipFile)
    
    // Get all file entries, sorted by name for consistent ordering
    const entries = Object.keys(zip.files)
      .filter(name => {
        const file = zip.files[name]
        // Skip directories and macOS metadata
        if (file.dir) return false
        if (name.startsWith('__MACOSX/')) return false
        if (name.startsWith('._')) return false
        if (name.includes('/.DS_Store') || name === '.DS_Store') return false
        if (name.includes('/Thumbs.db') || name === 'Thumbs.db') return false
        
        // Check if it's an image
        const extension = name.split('.').pop()?.toLowerCase() || ''
        return IMAGE_EXTENSIONS.includes(extension)
      })
      .sort()
    
    if (entries.length === 0) {
      console.warn('No image files found in ZIP for thumbnail extraction')
      return null
    }
    
    // Get the first image file
    const firstImagePath = entries[0]
    const imageFile = zip.files[firstImagePath]
    
    // Extract the image as a blob
    const blob = await imageFile.async('blob')
    const filename = firstImagePath.split('/').pop() || firstImagePath
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
    
    // Determine mimetype
    const mimetypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'tif': 'image/tiff',
      'tiff': 'image/tiff',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
    }
    const mimetype = mimetypes[extension] || 'application/octet-stream'
    
    return { blob, filename, mimetype }
  } catch (error) {
    console.error('Error extracting image from ZIP:', error)
    return null
  }
}

async function createStacksMedia(event) {
  if (isUploading.value) return // Prevent double submission
  
  const formData = new FormData(event.currentTarget)
  
  // FIX: Explicitly set is_copyrighted to 0 if checkbox is unchecked
  if (!formData.has('is_copyrighted')) {
    formData.set('is_copyrighted', '0')
  }
  
  // Validate required fields
  const errors = validateRequiredFields(formData)
  if (errors.length > 0) {
    showError(errors.join('; '), 'Validation Error')
    return
  }

  // Get the file to check its size
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    showError('Please select a ZIP file to upload', 'Validation Error')
    return
  }
  
  isUploading.value = true
  uploadProgress.value = 0
  uploadPhase.value = ''
  uploadSpeed.value = 0
  estimatedTimeRemaining.value = 0

  try {
    // Use direct S3 upload for large files to avoid proxy timeouts
    if (file.size > DIRECT_UPLOAD_THRESHOLD) {
      await uploadViaS3Direct(formData, file)
    } else {
      // Use traditional upload for smaller files
      await uploadTraditional(formData)
    }

    showSuccess('CT scan stacks uploaded successfully!')
    router.push({ path: `/myprojects/${projectId}/media` })
  } catch (error) {
    console.error('Stacks upload error:', error)
    
    // Extract specific error messages from backend response
    let errorMessage = 'Failed to create stacks media. Please try again.'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }
    
    // Display the error as notification
    showError(errorMessage, 'CT Scan Upload Failed')
  } finally {
    isUploading.value = false
    uploadPhase.value = ''
    uploadProgress.value = 0
  }
}

/**
 * Upload using direct-to-S3 presigned URL (for large files)
 * This bypasses CloudFront/httpd proxy timeouts
 */
async function uploadViaS3Direct(formData, file) {
  // Phase 1: Initiate the upload and extract thumbnail in parallel
  uploadPhase.value = 'initiating'
  
  const metadata = {
    filename: file.name,
    filesize: file.size,
    specimen_id: formData.get('specimen_id'),
    view_id: formData.get('view_id'),
    is_copyrighted: formData.get('is_copyrighted'),
    copyright_permission: formData.get('copyright_permission'),
    copyright_license: formData.get('copyright_license'),
    copyright_info: formData.get('copyright_info'),
    notes: formData.get('notes'),
  }

  // Start both operations in parallel for efficiency
  const [initResponse, thumbnailData] = await Promise.all([
    mediaStore.initiateStacksUpload(projectId, metadata),
    extractFirstImageFromZip(file)
  ])
  
  if (!initResponse || !initResponse.uploadUrl) {
    throw new Error('Failed to get upload URL from server')
  }

  const { mediaId, uploadUrl } = initResponse

  // Phase 2: Upload directly to S3
  uploadPhase.value = 'uploading'
  
  try {
    await uploadToS3WithProgress(uploadUrl, file)
  } catch (uploadError) {
    // If S3 upload fails, we should clean up the pending media record
    // The backend will handle orphan cleanup, but we inform the user
    throw new Error(`Upload to storage failed: ${uploadError.message}`)
  }

  // Phase 3: Complete the upload with the extracted thumbnail
  // This sends the thumbnail to the backend instead of having the backend download the ZIP
  uploadPhase.value = 'processing'
  uploadProgress.value = 100
  
  const media = await mediaStore.completeStacksUpload(projectId, mediaId, thumbnailData)
  
  if (!media) {
    throw new Error('Failed to finalize upload')
  }
}

/**
 * Upload using traditional form submission (for smaller files)
 */
async function uploadTraditional(formData) {
  uploadPhase.value = 'uploading'
  
  const success = await mediaStore.createStacks(projectId, formData)
  if (!success) {
    throw new Error('Failed to create stacks media. Please check your input and try again.')
  }
}

onMounted(() => {
  if (!mediaStore.isLoaded) {
    mediaStore.fetchMedia(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <div class="text_block">
        <span style="font-size: 18px">
          <b>Upload CT Scan Stacks</b>
        </span>
        <span>
          Did you add your
          <RouterLink :to="`/myprojects/${projectId}/specimens/`"
            >specimens</RouterLink
          >
          and
          <RouterLink :to="`/myprojects/${projectId}/views/`">views</RouterLink>
          first?
        </span>
      </div>
    </header>
    <div class="alert alert-info">
      <i class="fa fa-info-circle"></i>
      Upload a ZIP archive containing CT scan slices in DICOM (.dcm, .dicom) or TIFF (.tif, .tiff) formats.
      The ZIP is stored as-is; slices are not unpacked into separate media files. A thumbnail is generated from the first image file found in the archive.
      <strong>The maximum accepted file size for a ZIP archive is 1.5 GB.</strong>
    </div>
    <form @submit.prevent="createStacksMedia">
      <div class="row setup-content">
        
        <template v-for="(definition, index) in stacksSchema" :key="index">
          <div v-if="!definition.existed" class="form-group">
            <label :for="index" class="form-label">
              {{ definition.label }}
              <span v-if="definition.required" class="required">Required</span>
            </label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              v-bind="definition.args"
            >
            </component>
          </div>
        </template>
        <!-- Upload Progress Indicator -->
        <div v-if="isUploading" class="upload-progress-container">
          <div class="progress-header">
            <span class="progress-phase">
              <i class="fa fa-spinner fa-spin"></i>
              <span v-if="uploadPhase === 'initiating'">Preparing upload...</span>
              <span v-else-if="uploadPhase === 'uploading'">Uploading to storage...</span>
              <span v-else-if="uploadPhase === 'processing'">Processing CT scan...</span>
              <span v-else>Uploading...</span>
            </span>
            <span class="progress-percent">{{ uploadProgress }}%</span>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          
          <div v-if="uploadPhase === 'uploading' && uploadSpeed > 0" class="progress-stats">
            <span class="upload-speed">{{ formatBytes(uploadSpeed) }}/s</span>
            <span v-if="estimatedTimeRemaining > 0" class="time-remaining">
              ~{{ formatTime(estimatedTimeRemaining) }} remaining
            </span>
          </div>
          
          <p class="upload-note">
            <i class="fa fa-info-circle"></i>
            Large files upload directly to storage. Please keep this page open.
          </p>
        </div>

        <div class="btn-form-group">
          <button
            class="btn btn-outline-primary"
            type="button"
            @click="$router.go(-1)"
            :disabled="isUploading"
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit" :disabled="isUploading">
            <span v-if="isUploading">
              <i class="fa fa-spinner fa-spin"></i>
              {{ uploadPhase === 'processing' ? 'Processing...' : 'Uploading...' }}
            </span>
            <span v-else>Upload Stacks</span>
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped>
@import '@/views/project/steps.css';

.alert {
  padding: 12px 16px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.text_block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.text_block span:first-child {
  font-weight: bold;
}

.text_block a {
  color: #007bff;
  text-decoration: none;
}

.text_block a:hover {
  text-decoration: underline;
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-label {
  font-weight: bold;
}

/* Upload Progress Styles */
.upload-progress-container {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-phase {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #495057;
}

.progress-phase i {
  color: #007bff;
}

.progress-percent {
  font-weight: 600;
  font-size: 18px;
  color: #007bff;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background-color: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 8px;
}

.upload-speed {
  font-weight: 500;
}

.time-remaining {
  font-style: italic;
}

.upload-note {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.upload-note i {
  color: #17a2b8;
}
</style>