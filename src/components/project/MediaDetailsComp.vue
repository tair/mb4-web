<script setup>
import { ref, computed, onMounted } from 'vue'
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
import { defineAsyncComponent } from 'vue'

// Lazy load the 3D viewer to improve initial page load performance
const ThreeJSViewer = defineAsyncComponent({
  loader: () => import('./ThreeJSViewer.vue'),
  loadingComponent: {
    template: `
      <div class="lazy-loading-3d">
        <div class="loading-spinner"></div>
        <p>Loading 3D viewer...</p>
      </div>
    `
  },
  errorComponent: {
    template: `
      <div class="lazy-error-3d">
        <p>Failed to load 3D viewer</p>
        <button @click="$emit('retry')" class="btn btn-primary">Retry</button>
      </div>
    `
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
})

const showZoomModal = ref(false)
const showDownloadModal = ref(false)
const videoPlayer = ref(null)
const viewStatsTooltipText = getViewStatsTooltipText()
const downloadTooltipText = getDownloadTooltipText()

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
                @close="showZoomModal = false"
              >
                <!-- Three.js 3D Viewer for all 3D files -->
                <ThreeJSViewer
                  v-if="is3DFile"
                  :modelUrl="modelUrl"
                  :fileExtension="fileExtension"
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
                <!-- Regular Image Viewer for 2D files -->
                <MediaViewPanel
                  v-else
                  :imgSrc="zoomDisplayUrl"
                />
              </CustomModal>
              <a class="nav-link" href="#" @click="showDownloadModal = true">
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
            <img :src="`/images/${media_file.license.image}`" class="cc-icon" />
          </div>
          <div v-if="media_file.license && media_file.license.isOneTimeUse">
            <p>
              Copyright license for future use: Media released for onetime use,
              no reuse without permission
            </p>
          </div>
          <div>
            <p class="card-title" v-if="media_file.media['ORIGINAL_FILENAME']">
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
</style>
