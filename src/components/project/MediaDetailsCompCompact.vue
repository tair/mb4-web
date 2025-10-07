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

// Reset annotation state when modal closes
const onModalClose = () => {
  showZoomModal.value = false
  annotationsLoaded.value = false
  annotationCount.value = 0
  // Reset 3D format attempt index for next time
  currentExtensionIndex.value = 0
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

// Get the file extension - NEVER empty for 3D files
const fileExtension = computed(() => {
  const filename = props.media_file?.media?.ORIGINAL_FILENAME || ''
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

// Get the 3D model URL for model-viewer
const modelUrl = computed(() => {
  if (is3DFile.value) {
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
  }
  return null
})

// Get the video URL for video player
const videoUrl = computed(() => {
  if (isVideoFile.value) {
    return buildMediaUrl(props.project_id, props.media_file?.media_id, 'original')
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
  // if (!isCaptchaVerified) {
  //   alert("Please complete the CAPTCHA");
  //   return;
  // }
  // CAPTCHA is completed, proceed with the download
  // For 3D files, videos, and TIFF files, always download the original file regardless of requested size
  const downloadSize = (is3DFile.value || isVideoFile.value || isOriginalTiffFile.value) ? 'original' : fileSize
  const downloadUrl = buildMediaUrl(
    props.project_id,
    props.media_file?.media_id,
    downloadSize
  )
  let downloadFileName = fileName
  if (!downloadFileName) {
    downloadFileName = getLastElementFromUrl(downloadUrl)
  }
  // TODO: create download blob after put the media file behind the API
  // const response = await fetch(downloadUrl);
  // const blob = await response.blob();
  // const url = URL.createObjectURL(blob);
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = downloadFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // URL.revokeObjectURL(url);

  showDownloadModal.value = false
  logDownload({
    project_id: props.project_id,
    download_type: DOWNLOAD_TYPES.MEDIA,
    row_id: props.media_file.media_id,
  })
}

function getLastElementFromUrl(url) {
  const parts = url.split('/')
  return parts[parts.length - 1]
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
                <ThreeJSViewer
                  v-if="is3DFile"
                  :modelUrl="modelUrl"
                  :fileExtension="fileExtension || 'stl'"
                  @load="onModelLoad"
                  @error="onModelError"
                />
                <!-- Video Player for video files -->
                <div v-else-if="isVideoFile" class="video-player-container">
                  <video
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
                        media_file.media['ORIGINAL_FILENAME']
                      )
                    "
                  >
                    I Acknowledge and Proceed
                  </button>
                </div>
              </CustomModal>
            </div>
          </div>
          <div v-if="media_file.license && media_file.license.image">
            <img :src="`/images/${media_file.license.image}`" class="cc-icon compact-cc" />
          </div>
          <div v-if="media_file.license && media_file.license.isOneTimeUse">
            <p class="compact-text">
              Copyright license for future use: Media released for onetime use,
              no reuse without permission
            </p>
          </div>
          <div>
            <p class="card-title compact-title" v-if="media_file.media['ORIGINAL_FILENAME']">
              Original filename: {{ media_file.media['ORIGINAL_FILENAME'] }}
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
        <div class="info-item">
          <strong>Taxonomic name</strong>
          <p v-html="media_file.taxon_name"></p>
        </div>
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
        <div class="info-item" v-if="media_file.copyright_holder">
          <strong>Copyright holder</strong>
          <p>{{ media_file.copyright_holder }}</p>
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
  max-width: 200px;
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
