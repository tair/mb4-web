<script setup>
import { ref, computed, defineAsyncComponent, h, watch } from 'vue'
import { toDateString } from '@/utils/date'
import {
  getViewStatsTooltipText,
  getDownloadTooltipText,
} from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import CustomModal from './CustomModal.vue'
import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import { buildMediaUrl } from '@/utils/fileUtils.js'
import { apiService } from '@/services/apiService.js'

// Lazy load the annotation viewer for the zoom modal only
const AnnotationViewer = defineAsyncComponent({
  loader: () => import('../media/AnnotationViewer.vue'),
  loadingComponent: {
    render() {
      return h('div', { class: 'lazy-loading-annotations' }, [
        h('div', { class: 'loading-spinner' }),
        h('p', 'Loading annotation viewer...')
      ])
    }
  },
  errorComponent: {
    render() {
      return h('div', { class: 'lazy-error-annotations' }, [
        h('p', 'Failed to load annotation viewer')
      ])
    }
  },
  delay: 200,
  timeout: 10000
})

// Lazy load the 3D viewer to improve initial page load performance
const ThreeJSViewer = defineAsyncComponent({
  loader: () => import('./ThreeJSViewer.vue'),
  loadingComponent: {
    render() {
      return h('div', { class: 'lazy-loading-3d' }, [
        h('div', { class: 'loading-spinner' }),
        h('p', 'Loading 3D viewer...')
      ])
    }
  },
  errorComponent: {
    render() {
      return h('div', { class: 'lazy-error-3d' }, [
        h('p', 'Failed to load 3D viewer'),
        h('button', { 
          class: 'btn btn-primary',
          onClick: () => window.location.reload()
        }, 'Retry')
      ])
    }
  },
  delay: 200,
  timeout: 10000
})

const props = defineProps({
  media_file: {
    type: Object,
  },
  project_id: {
    type: [Number, String],
    required: false,
  },
  // Add annotation support props
  canEdit: {
    type: Boolean,
    default: false
  },
  isProjectPublished: {
    type: Boolean,
    default: false
  },
  // Control whether to use linkId for annotation filtering (disable for edit/list contexts)
  useAnnotationLinkId: {
    type: Boolean,
    default: true
  }
})

const showZoomModal = ref(false)
const showDownloadModal = ref(false)
const videoPlayer = ref(null)
const viewStatsTooltipText = getViewStatsTooltipText()
const downloadTooltipText = getDownloadTooltipText()

// Video URL state (for pre-signed URLs)
const videoUrl = ref(null)
const loadingVideoUrl = ref(false)
const videoUrlError = ref(null)

// 3D Model URL state (for pre-signed URLs)
const modelUrlPresigned = ref(null)
const loadingModelUrl = ref(false)
const modelUrlError = ref(null)
const modelAbortController = ref(null)

// Math CAPTCHA state
const mathQuestion = ref('')
const mathAnswer = ref(null)
const userMathAnswer = ref('')
const isCaptchaVerified = ref(false)

// Fetch pre-signed URL for video files
const fetchVideoUrl = async () => {
  if (!isVideoFile.value || !props.project_id || !props.media_file?.media_id) {
    return
  }

  loadingVideoUrl.value = true
  videoUrlError.value = null
  videoUrl.value = null

  try {
    const response = await apiService.get(
      `/public/media/${props.project_id}/video-url/${props.media_file.media_id}`
    )
    const data = await response.json()
    
    if (data.success && data.url) {
      videoUrl.value = data.url
    } else {
      throw new Error('Failed to get video URL')
    }
  } catch (error) {
    console.error('Error fetching video URL:', error)
    videoUrlError.value = 'Failed to load video. Please try again.'
    // Fallback to direct URL (will still have issues but shows error)
    videoUrl.value = buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  } finally {
    loadingVideoUrl.value = false
  }
}

// Fetch pre-signed URL for 3D model files
const fetchModelUrl = async () => {
  // Cancel any in-flight request
  if (modelAbortController.value) {
    modelAbortController.value.abort()
  }
  
  if (!is3DFile.value || !props.project_id || !props.media_file?.media_id) {
    return
  }

  // Create new abort controller for this request
  const controller = new AbortController()
  modelAbortController.value = controller

  loadingModelUrl.value = true
  modelUrlError.value = null
  modelUrlPresigned.value = null

  try {
    const response = await apiService.get(
      `/public/media/${props.project_id}/media-url/${props.media_file.media_id}`,
      { 
        params: { fileSize: 'original' },
        signal: controller.signal
      }
    )
    const data = await response.json()
    
    if (data.success && data.url) {
      modelUrlPresigned.value = data.url
    } else {
      throw new Error('Failed to get 3D model URL')
    }
  } catch (error) {
    // Ignore aborted requests
    if (error.name === 'AbortError') {
      return
    }
    console.error('Error fetching 3D model URL:', error)
    modelUrlError.value = 'Failed to load 3D model. Please try again.'
    // Fallback to direct URL (may timeout for large files)
    modelUrlPresigned.value = buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  } finally {
    // Only clear loading state if this is still the active request
    if (modelAbortController.value === controller) {
      loadingModelUrl.value = false
      modelAbortController.value = null
    }
  }
}

// Watch for zoom modal opening and fetch URLs if needed
watch(showZoomModal, (newValue) => {
  if (newValue) {
    if (isVideoFile.value) {
      fetchVideoUrl()
    } else if (is3DFile.value) {
      fetchModelUrl()
    }
  }
})

// Reset modal state when closed
const onModalClose = () => {
  // IMPORTANT: Clear URLs FIRST before closing modal
  // This ensures ThreeJSViewer unmounts cleanly
  if (modelAbortController.value) {
    modelAbortController.value.abort()
    modelAbortController.value = null
  }
  if (isVideoFile.value) {
    videoUrl.value = null
    videoUrlError.value = null
  }
  if (is3DFile.value) {
    modelUrlPresigned.value = null
    modelUrlError.value = null
    loadingModelUrl.value = false
  }
  
  // Close modal last
  showZoomModal.value = false
}

// Reset download modal state when closed
const onDownloadModalClose = () => {
  showDownloadModal.value = false
  // Reset captcha when modal closes
  resetCaptcha()
}

// Math CAPTCHA functions
const generateMathQuestion = () => {
  let num1 = Math.floor(Math.random() * 10) + 1
  let num2 = Math.floor(Math.random() * 10) + 1
  const operators = ['+', '-', '×']
  const operator = operators[Math.floor(Math.random() * operators.length)]
  
  let answer
  switch (operator) {
    case '+':
      answer = num1 + num2
      break
    case '-':
      // Ensure positive result
      if (num1 < num2) {
        [num1, num2] = [num2, num1]
      }
      answer = num1 - num2
      break
    case '×':
      // Use smaller numbers for multiplication
      const smallNum1 = Math.floor(Math.random() * 5) + 1
      const smallNum2 = Math.floor(Math.random() * 5) + 1
      mathQuestion.value = `${smallNum1} × ${smallNum2} = ?`
      mathAnswer.value = smallNum1 * smallNum2
      userMathAnswer.value = ''
      isCaptchaVerified.value = false
      return
  }
  
  mathQuestion.value = `${num1} ${operator} ${num2} = ?`
  mathAnswer.value = answer
  userMathAnswer.value = ''
  isCaptchaVerified.value = false
}

const verifyMathAnswer = () => {
  const userAnswer = parseInt(userMathAnswer.value)
  isCaptchaVerified.value = userAnswer === mathAnswer.value
  
  if (!isCaptchaVerified.value && userMathAnswer.value !== '') {
    // Give user feedback but don't immediately regenerate
    setTimeout(() => {
      if (!isCaptchaVerified.value && userMathAnswer.value !== '') {
        generateMathQuestion()
      }
    }, 1500)
  }
}

const resetCaptcha = () => {
  generateMathQuestion()
}

// Check if the media file is a 3D file
const is3DFile = computed(() => {
  return props.media_file?.media?.thumbnail?.USE_ICON === '3d' || 
         props.media_file?.media?.original?.USE_ICON === '3d'
})

// Check if the media file is a video file
const isVideoFile = computed(() => {
  const filename = props.media_file?.media?.ORIGINAL_FILENAME || ''
  const ext = filename.split('.').pop()?.toLowerCase()
  const videoExtensions = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'wmv', 'flv', 'm4v']
  return videoExtensions.includes(ext)
})

// Get the file extension from the original filename
const fileExtension = computed(() => {
  const filename = props.media_file?.media?.ORIGINAL_FILENAME || ''
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext || ''
})

// Check if the original file is a TIFF file (for download logic)
const isOriginalTiffFile = computed(() => {
  const originalMedia = props.media_file?.media?.original
  return originalMedia && (originalMedia.MIMETYPE === 'image/tiff' || originalMedia.MIMETYPE === 'image/tif')
})

// Get the main display URL (3D icon for 3D files, video thumbnail for videos, actual image for 2D files)
const mainDisplayUrl = computed(() => {
  if (is3DFile.value) {
    return '/images/3DImage.png'
  }
  if (isVideoFile.value) {
    // For videos, show a thumbnail if available, otherwise show video icon
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'thumbnail')
  }
  
  // For regular images, prefer JPEG variants for browser compatibility
  // CANT FIGURE OUT WHY THIS WORKS.... BUT IT DOES SO KEEPING IT
  const media = props.media_file?.media
  if (media) {
    // Try large first (usually JPEG), finally original
    const sizePreference = ['large', 'original']
    for (const size of sizePreference) {
      if (media[size] && media[size].MIMETYPE !== 'image/tiff' && media[size].MIMETYPE !== 'image/tif') {
        return buildMediaUrl(props.project_id, props.media_file?.media_id, size)
      }
    }
  }
  
  // Fallback to original if no JPEG variants found
  return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
})

// Get the 3D model URL for model-viewer (use pre-signed URL if available to avoid timeouts)
const modelUrl = computed(() => {
  if (is3DFile.value) {
    // Use pre-signed URL if available, otherwise fall back to regular URL
    return modelUrlPresigned.value || buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  return null
})

// Get the MIME type for the video
const videoMimeType = computed(() => {
  const ext = fileExtension.value
  const mimeTypes = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'm4v': 'video/x-m4v'
  }
  return mimeTypes[ext] || 'video/mp4'
})

// Check if annotations should be enabled (only for 2D images and if user can edit)
const annotationsEnabled = computed(() => {
  return !is3DFile.value && !isVideoFile.value && props.canEdit && !props.isProjectPublished
})


// Get the zoom display URL (3D model for 3D files, video for videos, large image for 2D files)
const zoomDisplayUrl = computed(() => {
  if (is3DFile.value) {
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  if (isVideoFile.value) {
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  
  // For zoom modal, use same smart logic as main display - prefer JPEG variants
  // CANT FIGURE OUT WHY THIS WORKS.... BUT IT DOES SO KEEPING IT FOR NOW
  const media = props.media_file?.media
  if (media) {
    // Try large first (usually JPEG), finally original
    const sizePreference = ['original', 'large']
    for (const size of sizePreference) {
      if (media[size] && media[size].MIMETYPE !== 'image/tiff' && media[size].MIMETYPE !== 'image/tif') {
        return buildMediaUrl(props.project_id, props.media_file?.media_id, size)
      }
    }
  }
  
  // Fallback to original if no JPEG variants found
  return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
})

// Handle model loading events from ThreeJSViewer
const onModelError = (error) => {
  console.error('3D model loading error:', error)
}

const onModelLoad = (model) => {
  // 3D model loaded successfully
}

// Handle video loading events
const onVideoError = (error) => {
  console.error('Video loading error:', error)
}

const onVideoLoaded = (event) => {
  // Video metadata loaded
}

const onVideoDataLoaded = (event) => {
  // Video data loaded - seeking should now work
}

const onVideoCanPlay = (event) => {
  // Video can play - seeking enabled
  // Ensure the video element is properly configured for seeking
  const video = event.target
  if (video.seekable && video.seekable.length > 0) {
    // Video is seekable
  }
}

const onVideoProgress = (event) => {
  // This helps track buffering progress which affects seeking
  const video = event.target
  if (video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    // Video buffered progress tracked
  }
}

const onVideoSeeking = (event) => {
  // Video seeking in progress
}

const onVideoSeeked = (event) => {
  // Video seek completed
}

const onVideoCanPlayThrough = (event) => {
  // Video can play through - fully loaded and seekable
}

const onVideoTimeUpdate = (event) => {
  // Track current time (useful for debugging seeking issues)
  const video = event.target
  if (video.seeking) {
    // Currently seeking
  }
}

// Image loading event handlers
const onImageError = (event) => {
  // Handle image loading errors if needed
}

const onImageLoad = (event) => {
  // Handle successful image loading if needed
}

// ============================================================================
// Annotation Event Handlers
// ============================================================================

const onAnnotationsLoaded = (count) => {
  // Annotation count received from AnnotationViewer
}

const onAnnotationsSaved = () => {
  // Annotations saved successfully
}

async function confirmDownload(fileSize, fileName) {
  if (!isCaptchaVerified.value) {
    alert("Please complete the security verification before downloading.");
    return;
  }
  
  // CAPTCHA is completed, proceed with the download
  // For 3D files, videos, and TIFF files, always download the original file regardless of requested size
  const downloadSize = (is3DFile.value || isVideoFile.value || isOriginalTiffFile.value) ? 'original' : fileSize
  
  let downloadUrl
  let downloadFileName
  
  // For videos and 3D files, use pre-signed URL to avoid proxy timeout for large files
  if (isVideoFile.value || is3DFile.value) {
    try {
      // Use video-url endpoint for videos, media-url for everything else
      const endpoint = isVideoFile.value 
        ? `/public/media/${props.project_id}/video-url/${props.media_file.media_id}`
        : `/public/media/${props.project_id}/media-url/${props.media_file.media_id}`
      
      const params = isVideoFile.value 
        ? { download: 'true' }
        : { fileSize: downloadSize, download: 'true' }
      
      const response = await apiService.get(endpoint, { params })
      const data = await response.json()
      
      if (data.success && data.url) {
        downloadUrl = data.url
        // Use the filename from the response (backend now returns M{mediaId}.{extension})
        downloadFileName = data.filename || generateDownloadFilename(props.media_file.media_id, getExtensionFromUrl(downloadUrl))
      } else {
        throw new Error(`Failed to get ${isVideoFile.value ? 'video' : 'media'} download URL`)
      }
    } catch (error) {
      console.error(`Error fetching ${isVideoFile.value ? 'video' : 'media'} download URL:`, error)
      alert(`Failed to download ${isVideoFile.value ? 'video' : 'file'}. Please try again.`)
      return
    }
  } else {
    // For regular image files, use regular URL (they're usually small)
    downloadUrl = buildMediaUrl(
      props.project_id,
      props.media_file?.media_id,
      downloadSize
    )
    // Extract extension from media file data or URL, default to jpg
    const extension = getMediaFileExtension() || getExtensionFromUrl(downloadUrl) || fileExtension.value || 'jpg'
    downloadFileName = generateDownloadFilename(props.media_file.media_id, extension)
  }
  
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = downloadFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showDownloadModal.value = false
  logDownload({
    project_id: props.project_id,
    download_type: DOWNLOAD_TYPES.MEDIA,
    row_id: props.media_file.media_id,
  })
}

/**
 * Generate download filename in the format M{mediaId}.{extension}
 * @param {number|string} mediaId - The media ID
 * @param {string} extension - File extension without dot (e.g., "jpg", "mp4", "tif")
 * @returns {string} Download filename in format M{mediaId}.{extension}
 */
function generateDownloadFilename(mediaId, extension) {
  const ext = extension || 'jpg'
  return `M${mediaId}.${ext}`
}

/**
 * Extract file extension from media file data
 * @returns {string|null} File extension without dot, or null if not found
 */
function getMediaFileExtension() {
  const mediaData = props.media_file?.media
  
  // Try to get extension from original media data
  if (mediaData?.original) {
    const original = mediaData.original
    // Check S3 key
    if (original.s3_key || original.S3_KEY) {
      const s3Key = original.s3_key || original.S3_KEY
      const match = s3Key.match(/\.([a-z0-9]+)$/i)
      if (match) return match[1].toLowerCase()
    }
    // Check filename
    if (original.FILENAME) {
      const match = original.FILENAME.match(/\.([a-z0-9]+)$/i)
      if (match) return match[1].toLowerCase()
    }
  }
  
  // Try ORIGINAL_FILENAME
  if (mediaData?.ORIGINAL_FILENAME) {
    const match = mediaData.ORIGINAL_FILENAME.match(/\.([a-z0-9]+)$/i)
    if (match) return match[1].toLowerCase()
  }
  
  return null
}

/**
 * Extract file extension from URL
 * @param {string} url - The URL to extract extension from
 * @returns {string|null} File extension without dot, or null if not found
 */
function getExtensionFromUrl(url) {
  if (!url) return null
  // Remove query parameters first
  const urlWithoutQuery = url.split('?')[0]
  // Extract extension from the last part of the URL
  const match = urlWithoutQuery.match(/\.([a-z0-9]+)$/i)
  return match ? match[1].toLowerCase() : null
}

function getAncestorMessage(mediaObj) {
  let message =
    'This media file was first entered in MorphoBank as M' +
    mediaObj.ancestor.media_id +
    ' in P' +
    mediaObj.ancestor.project_id
  if (mediaObj.ancestor.deleted) {
    message +=
      '. This project which the media file was first entered has since been deleted.'
  }
  return message
}

function getSibilingMessage(mediaObj) {
  let message = 'It has also been used in: '
  message += mediaObj.ancestor.child_siblings
    .map((obj) => `P${obj.project_id} as M${obj.media_id}`)
    .join(', ')
  message += '.'
  return message
}

function getHitsMessage(mediaObj) {
  let message = ''
  if (mediaObj.hits) {
    message =
      ' This media record has been viewed ' +
      mediaObj.hits +
      ' time' +
      (mediaObj.hits == 1 ? '' : 's')
    if (mediaObj.downloads) {
      message +=
        ' and downloaded ' +
        mediaObj.downloads +
        ' time' +
        (mediaObj.downloads == 1 ? '' : 's')
    }
  } else {
    if (mediaObj.downloads) {
      message =
        'This media record has been downloaded ' +
        mediaObj.downloads +
        ' time' +
        (mediaObj.downloads == 1 ? '' : 's')
    }
  }

  return message
}
</script>

<template>
  <div v-if="!media_file">Please select a media from the list.</div>

  <div v-else class="row p-2">
    <div class="col">
      <div class="card shadow">
        <img
          :src="mainDisplayUrl"
          :style="{
            backgroundSize: '20px',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(' + '/images/loader.png' + ')',
            backgroundPosition: '10px 10px',
          }"
          class="card-img"
          @error="onImageError"
          @load="onImageLoad"
        />

        <div class="card-body">
          <div class="card-text">
            <div class="nav">
              <a class="nav-link" href="#" @click="showZoomModal = true">
                Zoom
              </a>
              <CustomModal
                :isVisible="showZoomModal"
                @close="onModalClose"
              >
                <!-- Three.js 3D Viewer for all 3D files -->
                <div v-if="is3DFile" class="model-viewer-container">
                  <!-- Loading state -->
                  <div v-if="loadingModelUrl" class="model-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading 3D model...</p>
                  </div>
                  <!-- Error state -->
                  <div v-else-if="modelUrlError" class="model-error">
                    <p>{{ modelUrlError }}</p>
                    <button @click="fetchModelUrl" class="btn btn-primary btn-sm">Retry</button>
                  </div>
                  <!-- 3D Viewer -->
                  <ThreeJSViewer
                    v-else-if="modelUrl && showZoomModal"
                    :key="`model-viewer-${media_file?.media_id}-${modelUrl}`"
                    :modelUrl="modelUrl"
                    :fileExtension="fileExtension"
                    @load="onModelLoad"
                    @error="onModelError"
                  />
                </div>
                <!-- Video Player for video files -->
                <div v-else-if="isVideoFile" class="video-player-container">
                  <!-- Loading state -->
                  <div v-if="loadingVideoUrl" class="video-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading video...</p>
                  </div>
                  <!-- Error state -->
                  <div v-else-if="videoUrlError" class="video-error">
                    <p>{{ videoUrlError }}</p>
                    <button @click="fetchVideoUrl" class="btn btn-primary btn-sm">Retry</button>
                  </div>
                  <!-- Video player -->
                  <video
                    v-else-if="videoUrl"
                    ref="videoPlayer"
                    controls
                    preload="auto"
                    class="video-player"
                    crossorigin="anonymous"
                    muted="false"
                    playsinline
                    @error="onVideoError"
                    @loadedmetadata="onVideoLoaded"
                    @loadeddata="onVideoDataLoaded"
                    @canplay="onVideoCanPlay"
                    @canplaythrough="onVideoCanPlayThrough"
                    @progress="onVideoProgress"
                    @seeking="onVideoSeeking"
                    @seeked="onVideoSeeked"
                    @timeupdate="onVideoTimeUpdate"
                  >
                    <source :src="videoUrl" :type="videoMimeType" />
                    <p>Your browser doesn't support video playback.</p>
                  </video>
                </div>
                <!-- Annotation Viewer for all 2D images -->
                <AnnotationViewer
                  v-else-if="!is3DFile && !isVideoFile"
                  :media-id="media_file.media_id"
                  :project-id="Number(project_id)"
                  :media-url="zoomDisplayUrl"
                  :can-edit="annotationsEnabled"
                  :link-id="useAnnotationLinkId ? media_file.media_id : null"
                  :save-link-id="media_file.media_id"
                  :published="isProjectPublished"
                  type="M"
                  @annotationsLoaded="onAnnotationsLoaded"
                  @annotationsSaved="onAnnotationsSaved"
                />
              </CustomModal>
              <a class="nav-link" href="#" @click="showDownloadModal = true; generateMathQuestion()">
                Download
                <Tooltip :content="downloadTooltipText"></Tooltip>
              </a>
              <CustomModal
                :isVisible="showDownloadModal"
                @close="onDownloadModalClose"
              >
                <div>
                  <h2>Copyright Warning</h2>
                  <p>
                    You are downloading media from MorphoBank. If you plan to
                    reuse this item you must check the copyright reuse policy in
                    place for this item.<br />
                    Please acknowledge that you have read and understood the
                    copyright warning before proceeding with the download.
                  </p>
                  
                  <!-- Math CAPTCHA Component -->
                  <div class="math-captcha-container mb-3">
                    <div class="math-captcha-header">
                      <h5>Security Verification</h5>
                      <small class="text-muted">Please solve this simple math problem to continue:</small>
                    </div>
                    
                    <div class="math-captcha-question">
                      <label class="math-question-label">{{ mathQuestion }}</label>
                      <div class="math-input-group">
                        <input 
                          v-model="userMathAnswer" 
                          type="number" 
                          class="form-control math-input"
                          placeholder="Enter answer"
                          @input="verifyMathAnswer"
                          :class="{ 'is-valid': isCaptchaVerified && userMathAnswer, 'is-invalid': !isCaptchaVerified && userMathAnswer }"
                        />
                        <button 
                          type="button" 
                          class="btn btn-outline-secondary btn-sm refresh-btn"
                          @click="generateMathQuestion"
                          title="Get a new question"
                        >
                          ↻
                        </button>
                      </div>
                      
                      <div class="math-feedback">
                        <small v-if="isCaptchaVerified" class="text-success">
                          ✓ Correct! You may now proceed with the download.
                        </small>
                        <small v-else-if="userMathAnswer && !isCaptchaVerified" class="text-danger">
                          ✗ Incorrect answer. Please try again.
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    class="btn btn-primary"
                    :disabled="!isCaptchaVerified"
                    :class="{ 'btn-success': isCaptchaVerified }"
                    @click="
                      confirmDownload(
                        'original',
                        media_file.media['ORIGINAL_FILENAME']
                      )
                    "
                  >
                    {{ isCaptchaVerified ? 'I Acknowledge and Proceed' : 'Complete Security Check First' }}
                  </button>
                </div>
              </CustomModal>
            </div>
          </div>
          <div v-if="media_file.license && media_file.license.image">
            <img :src="`/images/${media_file.license.image}`" class="cc-icon" />
          </div>
          <div v-if="media_file.license && media_file.license.isOneTimeUse">
            <p>
              Copyright license for future use: Media released for onetime use,
              no reuse without permission
            </p>
          </div>
          <div>
            <p class="card-title filename-display" v-if="media_file.media['ORIGINAL_FILENAME']">
              Original filename: {{ media_file.media['ORIGINAL_FILENAME'] }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="col">
      <div>
        <strong>Morphobank media number</strong>
        <p>{{ 'M' + media_file.media_id }}</p>
      </div>
      <div>
        <strong>Taxonomic name</strong>
        <p v-html="media_file.taxon_name"></p>
      </div>
      <div v-if="media_file.specimen_name">
        <strong>Specimen</strong>
        <p v-html="media_file.specimen_name"></p>
      </div>
      <div v-if="media_file.specimen_notes">
        <strong>Specimen notes</strong>
        <p v-html="media_file.specimen_notes"></p>
      </div>
      <div v-if="media_file.view_name">
        <strong>View</strong>
        <p>{{ media_file.view_name }}</p>
      </div>
      <div v-if="media_file.side_represented">
        <strong>Side represented</strong>
        <p>{{ media_file.side_represented }}</p>
      </div>
      <div v-if="media_file.user_name">
        <strong>Media loaded by</strong>
        <p>{{ media_file.user_name }}</p>
      </div>
      <div v-if="media_file.copyright_holder">
        <strong>Copyright holder</strong>
        <p>{{ media_file.copyright_holder }}</p>
      </div>
      <div v-if="media_file.copyright_permission">
        <strong>Copyright information</strong>
        <p>{{ media_file.copyright_permission }}</p>
      </div>
      <div v-if="media_file.references">
        <strong>{{
          media_file.references.length > 1
            ? 'Bibliographic References'
            : 'Bibliographic Reference'
        }}</strong>
        <p v-html="media_file.references.join('<br/>')"></p>
      </div>
      <div v-if="media_file.notes">
        <strong>Media Notes</strong>
        <p v-html="media_file.notes"></p>
      </div>
      <div v-if="media_file.url">
        <strong>Web source of media</strong>
        <p>
          <a :href="media_file.url" target="_blank"
            >View media online &raquo;</a
          >
        </p>
      </div>
      <div v-if="media_file.url_description">
        <strong>Web source description</strong>
        <p v-html="media_file.url_description"></p>
      </div>
      <div v-if="media_file.created_on">
        <strong>Media loaded on</strong>
        <p>{{ toDateString(media_file.created_on) }}</p>
      </div>
      <div v-if="media_file.ancestor">
        <strong>{{ getAncestorMessage(media_file) }}</strong>
        <p v-if="media_file.ancestor.child_siblings">
          <i v-html="getSibilingMessage(media_file)"></i>
        </p>
      </div>
      <div class="mb-4" v-if="getHitsMessage(media_file)">
        {{ getHitsMessage(media_file) }}
        <Tooltip :content="viewStatsTooltipText"></Tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cc-icon {
  max-width: 88px;
  height: auto;
  object-fit: contain;
  margin-bottom: 1rem;
}

.card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 1rem;
}

.card-img {
  margin: 1rem;
  max-width: 400px;
  max-height: 400px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.nav {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.nav-link {
  margin: 0 0.5rem;
  text-decoration: none;
  color: #007bff;
}

.nav-link:hover {
  text-decoration: underline;
}

.card-title,
p {
  margin: 0.5rem 0;
}

/* ThreeJSViewer handles all 3D rendering styles internally */

.lazy-loading-3d, .lazy-error-3d {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.lazy-loading-3d .loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Video Player Styles */
.video-player-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 1rem;
  background-color: #000;
  border-radius: 8px;
}

.video-player {
  max-width: 100%;
  max-height: 80vh;
  width: auto;
  height: auto;
  border-radius: 4px;
}

/* Video loading and error states */
.video-loading,
.video-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #fff;
  text-align: center;
}

.video-loading .loading-spinner {
  border: 4px solid #333;
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.video-error {
  color: #ff6b6b;
}

.video-error p {
  margin-bottom: 1rem;
}

/* 3D Model loading and error states */
.model-viewer-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.model-loading,
.model-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #333;
  text-align: center;
}

.model-loading .loading-spinner {
  border: 4px solid #e3e3e3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.model-error {
  color: #dc3545;
}

.model-error p {
  margin-bottom: 1rem;
}

/* Annotation loading states */
.lazy-loading-annotations,
.lazy-error-annotations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

.lazy-loading-annotations .loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e3e3e3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lazy-error-annotations {
  color: #dc3545;
}

/* Filename display styling */
.filename-display {
  max-width: 450px;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: 1.4;
}

/* Math CAPTCHA Styling */
.math-captcha-container {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  background-color: #f8f9fa;
  margin: 20px 0;
}

.math-captcha-header {
  text-align: center;
  margin-bottom: 15px;
}

.math-captcha-header h5 {
  color: #495057;
  margin-bottom: 5px;
  font-weight: 600;
}

.math-captcha-question {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.math-question-label {
  font-size: 1.2rem;
  font-weight: bold;
  color: #343a40;
  margin-bottom: 10px;
  padding: 8px 16px;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  min-width: 120px;
  text-align: center;
}

.math-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.math-input {
  width: 100px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
}

.math-input:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.math-input.is-valid {
  border-color: #28a745;
}

.math-input.is-invalid {
  border-color: #dc3545;
}

.refresh-btn {
  width: 32px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: transform 0.2s ease;
}

.refresh-btn:hover {
  transform: rotate(90deg);
  background-color: #e9ecef;
}

.math-feedback {
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.math-feedback small {
  font-weight: 500;
}

/* Button state styling */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
  border-color: #1e7e34;
}
</style>
