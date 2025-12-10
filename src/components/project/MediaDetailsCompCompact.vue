<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent, h } from 'vue'
import { toDateString } from '@/utils/date'
import {
  getViewStatsTooltipText,
  getDownloadTooltipText,
} from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import CustomModal from './CustomModal.vue'
import MediaViewPanel from './MediaViewPanel.vue'
import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import { buildMediaUrl } from '@/utils/fileUtils.js'
import annotationService from '@/services/annotationService.js'
import { apiService } from '@/services/apiService.js'
import { getCopyrightImagePath, getCopyrightTitle } from '@/utils/copyright.ts'

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

// Preload annotations to avoid race condition
const preloadAnnotations = async () => {
  if (!showAnnotations.value || annotationsLoaded.value) return
  
  try {
    const annotations = await annotationService.getAnnotations(
      Number(props.project_id),
      props.media_file?.media_id,
      'M',
      props.useAnnotationLinkId ? props.media_file?.media_id : null
    )
    
    annotationsLoaded.value = true
    annotationCount.value = annotations.length
  } catch (error) {
    console.error('Failed to preload annotations:', error)
    annotationsLoaded.value = true
    annotationCount.value = 0
  }
}

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

// Reset annotation state when modal closes
const onModalClose = () => {
  // IMPORTANT: Clear URLs and state FIRST before closing modal
  // This ensures ThreeJSViewer unmounts cleanly
  annotationsLoaded.value = false
  annotationCount.value = 0
  currentExtensionIndex.value = 0
  
  // Cancel any in-flight model URL request
  if (modelAbortController.value) {
    modelAbortController.value.abort()
    modelAbortController.value = null
  }
  
  // Clear URLs when modal closes to save memory
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

// Check if the media file is a 3D file - ROBUST DETECTION
const is3DFile = computed(() => {
  if (!props.media_file) {
    return false
  }

  const mediaData = props.media_file.media || props.media_file
  
  // Method 1: Check media_type field (primary method for this data structure)
  if (mediaData?.media_type === '3d' || mediaData?.media_type === '3D') {
    return true
  }
  
  // Method 2: Check USE_ICON fields  
  const useIconChecks = [
    mediaData?.thumbnail?.USE_ICON,
    mediaData?.original?.USE_ICON,
    mediaData?.USE_ICON,
    mediaData?.icon,
    mediaData?.type
  ]
  
  for (let i = 0; i < useIconChecks.length; i++) {
    const iconValue = useIconChecks[i]
    if (iconValue === '3d' || iconValue === '3D') {
      return true
    }
  }
  
  // Method 3: Check filename extensions
  const filenameChecks = [
    mediaData?.ORIGINAL_FILENAME,
    mediaData?.filename,
    mediaData?.original_filename,
    mediaData?.name,
    props.media_file?.filename,
    props.media_file?.original_filename
  ]
  
  const threeDExtensions = ['ply', 'stl', 'obj', 'gltf', 'glb', 'fbx', '3ds', 'dae', 'x3d', 'wrl']
  
  for (let i = 0; i < filenameChecks.length; i++) {
    const filename = filenameChecks[i]
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (threeDExtensions.includes(ext)) {
        return true
      }
    }
  }
  
  // Method 4: Check MIME type
  const mimeChecks = [
    mediaData?.original?.MIMETYPE,
    mediaData?.MIMETYPE,
    mediaData?.mime_type,
    mediaData?.mimetype
  ]
  
  for (let i = 0; i < mimeChecks.length; i++) {
    const mime = mimeChecks[i]
    if (mime && (mime.includes('model/') || mime.includes('application/sla'))) {
      return true
    }
  }
  
  return false
})

// Check if the media file is a video file - ROBUST DETECTION
const isVideoFile = computed(() => {
  if (!props.media_file) {
    return false
  }

  const mediaData = props.media_file.media || props.media_file

  // Method 1: Check media_type field
  if (mediaData?.media_type && String(mediaData.media_type).toLowerCase() === 'video') {
    return true
  }

  // Method 2: Check USE_ICON or related type fields
  const useIconChecks = [
    mediaData?.thumbnail?.USE_ICON,
    mediaData?.original?.USE_ICON,
    mediaData?.USE_ICON,
    mediaData?.icon,
    mediaData?.type
  ]

  for (let i = 0; i < useIconChecks.length; i++) {
    const iconValue = useIconChecks[i]
    if (iconValue && String(iconValue).toLowerCase() === 'video') {
      return true
    }
  }

  // Method 3: Check filename extensions across possible fields
  const filenameChecks = [
    mediaData?.ORIGINAL_FILENAME,
    mediaData?.filename,
    mediaData?.original_filename,
    mediaData?.name,
    mediaData?.original?.ORIGINAL_FILENAME,
    props.media_file?.filename,
    props.media_file?.original_filename
  ]

  const videoExtensions = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'wmv', 'flv', 'm4v']

  for (let i = 0; i < filenameChecks.length; i++) {
    const filename = filenameChecks[i]
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (ext && videoExtensions.includes(ext)) {
        return true
      }
    }
  }

  // Method 4: Check MIME type
  const mimeChecks = [
    mediaData?.original?.MIMETYPE,
    mediaData?.MIMETYPE,
    mediaData?.mime_type,
    mediaData?.mimetype
  ]

  for (let i = 0; i < mimeChecks.length; i++) {
    const mime = mimeChecks[i]
    if (mime && String(mime).toLowerCase().includes('video/')) {
      return true
    }
  }

  return false
})

// Track which extension we're trying for 3D files
const currentExtensionIndex = ref(0)
const threeDExtensionFallbacks = ['stl', 'ply', 'obj'] // Try STL first, then PLY, then OBJ

// Get the original filename from various possible locations
const originalFilename = computed(() => {
  const mediaData = props.media_file?.media || props.media_file
  
  // Try multiple possible locations for the filename
  const filenameChecks = [
    mediaData?.ORIGINAL_FILENAME,
    mediaData?.original_filename,
    props.media_file?.original_filename,
    mediaData?.filename,
    mediaData?.name
  ]
  
  for (let i = 0; i < filenameChecks.length; i++) {
    const filename = filenameChecks[i]
    if (filename) {
      return filename
    }
  }
  
  return null
})

// Build license information from raw values using the copyright utility
const licenseInfo = computed(() => {
  // Check both nested (media.media) and top-level locations for copyright fields
  // This handles different data structures from different API endpoints
  // Convert to numbers for proper comparison (values might come as strings)
  const isCopyrightedRaw = props.media_file?.media?.is_copyrighted ?? props.media_file?.is_copyrighted
  const copyrightPermissionRaw = props.media_file?.media?.copyright_permission ?? props.media_file?.copyright_permission
  const copyrightLicenseRaw = props.media_file?.media?.copyright_license ?? props.media_file?.copyright_license
  
  // If we have raw values, always rebuild from them to ensure freshness
  // Only use pre-built license if raw values are not available
  if (isCopyrightedRaw === null || isCopyrightedRaw === undefined) {
    // Fallback to pre-built license object if available
    if (props.media_file?.license) {
      return props.media_file.license
    }
    return null
  }
  
  // Convert to numbers/int for proper comparison
  // Note: isCopyrighted can be 0 (not copyrighted), 1 (copyrighted), or null (not set)
  const isCopyrighted = isCopyrightedRaw == null ? null : (isCopyrightedRaw === '' ? null : Number(isCopyrightedRaw))
  const copyrightPermission = copyrightPermissionRaw == null ? null : (copyrightPermissionRaw === '' ? null : Number(copyrightPermissionRaw))
  const copyrightLicense = copyrightLicenseRaw == null ? null : (copyrightLicenseRaw === '' ? null : Number(copyrightLicenseRaw))
  
  // Replicate backend logic from MediaFile.getLicenseImage
  // This matches the logic in mb4-service-1/src/models/media-file.js
  const result = {
    isOneTimeUse: false,
    image: null,
    description: getCopyrightTitle(copyrightPermission, copyrightLicense)
  }
  
  const licenseMap = {
    1: 'CC-0.png',
    2: 'CC-BY.png',
    3: 'CC-BY-NC.png',
    4: 'CC-BY-SA.png',
    5: 'CC-BY-NC-SA.png',
    6: 'CC-BY-ND.png',
    7: 'CC-BY-NC-ND.png',
  }
  
  // Explicitly check for 1 (copyrighted) vs 0 (not copyrighted)
  if (isCopyrighted === 1) {
    if (copyrightPermission == 4) {
      result.image = 'PDM.png'
    } else if (copyrightLicense > 0 && copyrightLicense < 8) {
      result.image = licenseMap[copyrightLicense]
    } else if (copyrightLicense == 8) {
      result.isOneTimeUse = true
    }
  } else if (isCopyrighted === 0) {
    // Media is NOT copyrighted - always show CC-0
    result.image = 'CC-0.png'
  }
  
  return result
})

// Get copyright holder from various possible locations
const copyrightHolder = computed(() => {
  // First check if it's already provided
  if (props.media_file?.copyright_holder) {
    return props.media_file.copyright_holder
  }
  
  // Check copyright_info field
  if (props.media_file?.copyright_info) {
    return props.media_file.copyright_info
  }
  
  // Fallback: build from user name if media is copyrighted
  if (props.media_file?.is_copyrighted && props.media_file?.user_name) {
    return props.media_file.user_name
  }
  
  return null
})

// Get the file extension - NEVER empty for 3D files
const fileExtension = computed(() => {
  const filename = originalFilename.value || ''
  const ext = filename.split('.').pop()?.toLowerCase()
  
  // If we have a valid 3D extension from filename, use it
  if (ext && ['ply', 'stl', 'obj', 'gltf', 'glb', 'fbx', '3ds', 'dae', 'x3d', 'wrl'].includes(ext)) {
    return ext
  }
  
  // FOR 3D FILES: ALWAYS provide an extension, never return empty
  if (is3DFile.value) {
    const fallbackExt = threeDExtensionFallbacks[currentExtensionIndex.value] || 'stl'
    return fallbackExt
  }
  
  return ext || ''
})

// Function to try next 3D format when current one fails
const tryNextFormat = () => {
  if (is3DFile.value && currentExtensionIndex.value < threeDExtensionFallbacks.length - 1) {
    currentExtensionIndex.value++
    return true
  }
  return false
}

// Check if the original file is a TIFF file (for download logic)
const isOriginalTiffFile = computed(() => {
  const originalMedia = props.media_file?.media?.original
  return originalMedia && (originalMedia.MIMETYPE === 'image/tiff' || originalMedia.MIMETYPE === 'image/tif')
})

// Check if the media file is a ZIP/archive file (CT scans, stacks)
// These need pre-signed URLs to avoid proxy timeout for large files
const isZipFile = computed(() => {
  // Handle both nested structures: props.media_file.media.media and props.media_file.media
  const mediaData = props.media_file?.media || props.media_file
  if (!mediaData) return false
  
  // Check multiple possible locations for the filename (same pattern as isVideoFile)
  const filenameChecks = [
    mediaData?.ORIGINAL_FILENAME,
    mediaData?.media?.ORIGINAL_FILENAME,
    mediaData?.original?.ORIGINAL_FILENAME,
    mediaData?.filename,
    props.media_file?.filename
  ]
  
  for (const filename of filenameChecks) {
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (ext === 'zip') return true
    }
  }
  
  // Fallback: Check nested original structure for MIME type
  const originalMedia = mediaData?.original || mediaData?.media?.original
  if (originalMedia) {
    if (originalMedia.MIMETYPE === 'application/zip' || 
        originalMedia.MIMETYPE === 'application/x-zip-compressed') {
      return true
    }
    if ((originalMedia.EXTENSION || '').toLowerCase() === 'zip') {
      return true
    }
  }
  
  // Fallback: Check USE_ICON for archives without extracted thumbnails
  const thumbnailMedia = mediaData?.thumbnail || mediaData?.media?.thumbnail
  if (thumbnailMedia?.USE_ICON === 'archive') {
    return true
  }
  
  return false
})

// Get the main display URL - ALWAYS use thumbnail for compact view
const mainDisplayUrl = computed(() => {
  if (is3DFile.value) {
    return '/images/3DImage.png'
  }
  if (isVideoFile.value) {
    // For videos, show a thumbnail if available, otherwise show video icon
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'thumbnail')
  }
  
  // For regular images, always use thumbnail in compact view
  return buildMediaUrl(props.project_id, props.media_file?.media_id, 'thumbnail')
})

// Get the 3D model URL for model-viewer (use pre-signed URL if available to avoid timeouts)
const modelUrl = computed(() => {
  if (is3DFile.value) {
    // Use pre-signed URL if available, otherwise fall back to regular URL
    return modelUrlPresigned.value || buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  return null
})

// Get the MIME type for the video (prefer server-provided MIME)
const videoMimeType = computed(() => {
  const mediaData = props.media_file?.media || props.media_file || {}

  // Prefer MIME provided by the API if available
  const mimeChecks = [
    mediaData?.original?.MIMETYPE,
    mediaData?.MIMETYPE,
    mediaData?.mime_type,
    mediaData?.mimetype
  ]
  for (let i = 0; i < mimeChecks.length; i++) {
    const mime = mimeChecks[i]
    if (mime && String(mime).toLowerCase().includes('video/')) {
      return mime
    }
  }

  // Fallback: infer from extension across common filename fields
  const filenameChecks = [
    mediaData?.ORIGINAL_FILENAME,
    mediaData?.filename,
    mediaData?.original_filename,
    mediaData?.name,
    mediaData?.original?.ORIGINAL_FILENAME,
    props.media_file?.filename,
    props.media_file?.original_filename
  ]
  let ext = ''
  for (let i = 0; i < filenameChecks.length; i++) {
    const filename = filenameChecks[i]
    if (filename) {
      ext = filename.split('.').pop()?.toLowerCase() || ''
      if (ext) break
    }
  }

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

// Check if annotations should be shown (read-only for published projects)
const showAnnotations = computed(() => {
  return !is3DFile.value && !isVideoFile.value
})

// Track if annotations are loaded and available
const annotationsLoaded = ref(false)
const annotationCount = ref(0)

// Determine whether to use annotation viewer or regular media viewer
// Use AnnotationViewer when user can edit OR when annotations exist
const useAnnotationViewer = computed(() => {
  if (!showAnnotations.value) return false
  
  // Always use if user can edit (they might want to add annotations)
  if (annotationsEnabled.value) return true
  
  // Use if annotations exist (to view them)
  if (annotationsLoaded.value && annotationCount.value > 0) return true
  
  // Default to false (use regular viewer) if can't edit and no annotations loaded yet
  return false
})

// Watch for modal opening and preload annotations to avoid race condition
watch(showZoomModal, (isOpen) => {
  if (isOpen && showAnnotations.value && !annotationsLoaded.value) {
    preloadAnnotations()
  }
})

// Get the zoom display URL - use original for zoom modal to maintain quality
const zoomDisplayUrl = computed(() => {
  if (is3DFile.value) {
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  if (isVideoFile.value) {
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  
  // For zoom modal, use original for best quality
  return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
})

// Handle model loading events from ThreeJSViewer
const onModelError = (error) => {
  // Try next format if available
  if (!tryNextFormat()) {
    // All format attempts failed
    console.error('Failed to load 3D model:', error)
  }
}

const onModelLoad = (model) => {
  // Do not reset currentExtensionIndex here to avoid remount loops.
  // It will be reset when the modal closes.
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
  annotationsLoaded.value = true
  annotationCount.value = count
}

const onAnnotationsSaved = () => {
}

async function confirmDownload(fileSize, fileName) {
  // Always use pre-signed S3 URL for all downloads - more performant and avoids proxy timeouts
  // For special file types (3D, video, TIFF, ZIP), always download original regardless of requested size
  const downloadSize = (is3DFile.value || isVideoFile.value || isOriginalTiffFile.value || isZipFile.value) ? 'original' : fileSize
  
  try {
    // Use media-url endpoint for pre-signed S3 URL (works for all file types)
    const endpoint = `/public/media/${props.project_id}/media-url/${props.media_file.media_id}`
    const params = { fileSize: downloadSize, download: 'true' }
    
    const response = await apiService.get(endpoint, { params })
    const data = await response.json()
    
    if (data.success && data.url) {
      const downloadUrl = data.url
      // Use the filename from the response (backend returns M{mediaId}.{extension})
      const downloadFileName = data.filename || generateDownloadFilename(props.media_file.media_id, getExtensionFromUrl(downloadUrl))
      
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
    } else {
      throw new Error('Failed to get download URL')
    }
  } catch (error) {
    console.error('Error fetching download URL:', error)
    alert('Failed to download file. Please try again.')
  }
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
  const mediaData = props.media_file?.media || props.media_file
  
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
  
  // Try original_filename
  if (props.media_file?.original_filename) {
    const match = props.media_file.original_filename.match(/\.([a-z0-9]+)$/i)
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
    <div class="col-md-4">
      <div class="card shadow compact-card">
        <img
          :src="mainDisplayUrl"
          :style="{
            backgroundSize: '20px',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(' + '/images/loader.png' + ')',
            backgroundPosition: '10px 10px',
          }"
          class="card-img compact-img"
          @error="onImageError"
          @load="onImageLoad"
        />

        <div class="card-body compact-body">
          <div class="card-text">
            <div class="nav compact-nav">
              <a class="nav-link compact-link" href="#" @click="showZoomModal = true">
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
                    :fileExtension="fileExtension || 'stl'"
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
                <!-- Annotation Viewer for 2D images (used for 2D media) -->
                <AnnotationViewer
                  v-else
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
              <a class="nav-link compact-link" href="#" @click="showDownloadModal = true">
                Download
                <Tooltip :content="downloadTooltipText"></Tooltip>
              </a>
              <CustomModal
                :isVisible="showDownloadModal"
                @close="showDownloadModal = false"
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
                  <button
                    class="btn btn-primary"
                    @click="
                      confirmDownload(
                        'original',
                        originalFilename
                      )
                    "
                  >
                    I Acknowledge and Proceed
                  </button>
                </div>
              </CustomModal>
            </div>
          </div>
          <div v-if="licenseInfo && licenseInfo.image">
            <img :src="`/images/${licenseInfo.image}`" class="cc-icon compact-cc" />
          </div>
          <div v-if="licenseInfo && licenseInfo.isOneTimeUse">
            <p class="compact-text">
              Copyright license for future use: Media released for onetime use,
              no reuse without permission
            </p>
          </div>
          <div v-if="copyrightHolder">
            <p class="compact-text">
              <strong>Copyright holder:</strong> {{ copyrightHolder }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-8">
      <div class="compact-info">
        <div class="info-item">
          <strong>Morphobank media number</strong>
          <p>{{ 'M' + media_file.media_id }}</p>
        </div>
        <div class="info-item" v-if="originalFilename">
          <strong>Original filename</strong>
          <p>{{ originalFilename }}</p>
        </div>
        <!-- <div class="info-item">
          <strong>Taxonomic name</strong>
          <p v-html="media_file.taxon_name"></p>
        </div> -->
        <div class="info-item" v-if="media_file.specimen_name">
          <strong>Specimen</strong>
          <p v-html="media_file.specimen_name"></p>
        </div>
        <div class="info-item" v-if="media_file.specimen_notes">
          <strong>Specimen notes</strong>
          <p v-html="media_file.specimen_notes"></p>
        </div>
        <div class="info-item" v-if="media_file.view_name">
          <strong>View</strong>
          <p>{{ media_file.view_name }}</p>
        </div>
        <div class="info-item" v-if="media_file.side_represented">
          <strong>Side represented</strong>
          <p>{{ media_file.side_represented }}</p>
        </div>
        <div class="info-item" v-if="media_file.user_name">
          <strong>Media loaded by</strong>
          <p>{{ media_file.user_name }}</p>
        </div>
        <div class="info-item" v-if="copyrightHolder">
          <strong>Copyright holder</strong>
          <p>{{ copyrightHolder }}</p>
        </div>
        <div class="info-item" v-if="media_file.copyright_permission">
          <strong>Copyright information</strong>
          <p>{{ media_file.copyright_permission }}</p>
        </div>
        <div class="info-item" v-if="media_file.references">
          <strong>{{
            media_file.references.length > 1
              ? 'Bibliographic References'
              : 'Bibliographic Reference'
          }}</strong>
          <p v-html="media_file.references.join('<br/>')"></p>
        </div>
        <div class="info-item" v-if="media_file.notes">
          <strong>Media Notes</strong>
          <p v-html="media_file.notes"></p>
        </div>
        <div class="info-item" v-if="media_file.url">
          <strong>Web source of media</strong>
          <p>
            <a :href="media_file.url" target="_blank"
              >View media online &raquo;</a
            >
          </p>
        </div>
        <div class="info-item" v-if="media_file.url_description">
          <strong>Web source description</strong>
          <p v-html="media_file.url_description"></p>
        </div>
        <div class="info-item" v-if="media_file.created_on">
          <strong>Media loaded on</strong>
          <p>{{ toDateString(media_file.created_on) }}</p>
        </div>
        <div class="info-item" v-if="media_file.ancestor">
          <strong>{{ getAncestorMessage(media_file) }}</strong>
          <p v-if="media_file.ancestor.child_siblings">
            <i v-html="getSibilingMessage(media_file)"></i>
          </p>
        </div>
        <div class="info-item mb-4" v-if="getHitsMessage(media_file)">
          {{ getHitsMessage(media_file) }}
          <Tooltip :content="viewStatsTooltipText"></Tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compact-card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0rem;
  max-width: 250px;
}

.compact-img {
  margin: 0.25rem;
  max-width: 100%;
  max-height: 180px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.compact-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.25rem;
  width: 100%;
  overflow: hidden;
}

.compact-nav {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.compact-link {
  margin: 0 0.25rem;
  text-decoration: none;
  color: #007bff;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
}

.compact-link:hover {
  text-decoration: underline;
}

.compact-cc {
  max-width: 80px;
  margin-bottom: 0.5rem;
}

.compact-title,
.compact-text {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  width: 100%;
  hyphens: auto;
}

.compact-body > div {
  width: 100%;
  max-width: 100%;
}

.compact-info {
  padding-left: 1rem;
}

.info-item {
  margin-bottom: 0.75rem;
}

.info-item strong {
  font-size: 0.9rem;
  color: #495057;
}

.info-item p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.cc-icon {
  width: 88;
  height: 31;
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
  max-width: 100%;
  max-height: 500px;
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

.cc-icon {
  max-width: 100px;
  margin-bottom: 1rem;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .compact-card {
    max-width: 100%;
  }
  
  .compact-img {
    max-height: 150px;
  }
  
  .compact-info {
    padding-left: 0;
    margin-top: 1rem;
  }
}
</style>
