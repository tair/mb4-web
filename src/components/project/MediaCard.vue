<script setup lang="ts">
import { ref, computed } from 'vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import { getCopyrightImagePath, getCopyrightTitle } from '@/utils/copyright'

interface Image {
  url: string
  width: string | number
  height: string | number
}

interface MediaData {
  media_id: number
  specimen_id?: number
  view_id?: number
  is_sided?: number
  is_copyrighted?: boolean | null
  copyright_permission?: number
  copyright_license?: number
  access?: number
  published?: number
  notes?: string
  url?: string
  url_description?: string
  media?: {
    original?: {
      FILENAME?: string
      s3_key?: string
    }
  }
  [key: string]: unknown
}

const props = defineProps<{
  mediaId: number
  image?: Image
  taxon?: { [key: string]: string }
  viewName?: string
  largeImageUrl?: string | null
  mediaData?: MediaData | null
  specimenName?: string | null
}>()

// Hover preview state
const isHovering = ref(false)
const isLargeImageLoaded = ref(false)
const largeImageFailed = ref(false)
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

// Helper functions for displaying field values
function getSideName(is_sided?: number): string {
  switch (is_sided) {
    case 1:
      return 'Left side'
    case 2:
      return 'Right side'
    default:
      return 'not entered'
  }
}

function getAccessText(access?: number): string {
  switch (access) {
    case 1:
      return 'Only the owner may edit this media item'
    default:
      return 'Anyone may edit this media item'
  }
}

function getStatusText(published?: number): string {
  switch (published) {
    case 1:
      return 'Never publish to project'
    default:
      return 'publish when project is published'
  }
}

function extractOriginalFilename(mediaData?: MediaData | null): string {
  if (!mediaData) return 'NA'
  
  // Get the nested media object (JSON field with image data)
  const nestedMedia = mediaData.media as Record<string, any> | undefined
  
  // Try multiple possible locations for the filename (same order as MediaDetailsCompCompact.vue)
  const filenameChecks = [
    // Top-level original_filename field
    (mediaData as any).original_filename,
    // Nested media ORIGINAL_FILENAME
    nestedMedia?.ORIGINAL_FILENAME,
    // Nested media original_filename
    nestedMedia?.original_filename,
    // Nested media filename
    nestedMedia?.filename,
    // Nested media name
    nestedMedia?.name,
  ]
  
  for (const filename of filenameChecks) {
    if (filename && typeof filename === 'string') {
      return filename
    }
  }
  
  // Try to extract from original.FILENAME or original.s3_key
  const original = nestedMedia?.original
  if (original) {
    if (original.FILENAME) {
      return original.FILENAME
    }
    
    // Try s3_key and extract filename
    const s3Key = original.s3_key || original.S3_KEY
    if (s3Key) {
      const parts = s3Key.split('/')
      const filename = parts[parts.length - 1]
      if (filename) return filename
    }
  }
  
  return 'NA'
}

// Computed properties for preview data
const copyrightImagePath = computed(() => {
  if (!props.mediaData) return null
  return getCopyrightImagePath(
    props.mediaData.copyright_permission || 0,
    props.mediaData.copyright_license || 0
  )
})

const copyrightTitle = computed(() => {
  if (!props.mediaData) return ''
  return getCopyrightTitle(
    props.mediaData.copyright_permission || 0,
    props.mediaData.copyright_license || 0
  )
})

const hasDetailedPreview = computed(() => {
  return props.largeImageUrl && props.mediaData
})

function onMouseEnter() {
  if (!hasDetailedPreview.value) return
  
  // Start loading the large image immediately
  preloadLargeImage()
  
  // Delay showing the preview to avoid flickering on quick mouse movements
  hoverTimeout = setTimeout(() => {
    isHovering.value = true
  }, 200)
}

function onMouseLeave() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  isHovering.value = false
}

function preloadLargeImage() {
  if (!props.largeImageUrl || isLargeImageLoaded.value || largeImageFailed.value) return
  
  const img = new Image()
  img.onload = () => {
    isLargeImageLoaded.value = true
  }
  img.onerror = () => {
    largeImageFailed.value = true
  }
  img.src = props.largeImageUrl
}

function onLargeImageLoad() {
  isLargeImageLoaded.value = true
}

function onLargeImageError() {
  largeImageFailed.value = true
}
</script>
<template>
  <div 
    class="mediaCard card shadow"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <slot name="bar"></slot>
    <div class="card-image">
      <img
        v-if="image"
        :src="image.url"
        :width="image.width"
        :height="image.height"
        class="loading thumbnail-image"
      />
      <span v-else></span>
    </div>
    <div class="card-body">
      <div class="card-text">
        <div>M{{ mediaId }}</div>
        <TaxonomicName v-if="taxon" :showExtinctMarker="true" :taxon="taxon" />
        <div v-if="viewName">
          {{ viewName }}
        </div>
      </div>
    </div>
    
    <!-- Detailed Hover Preview Card -->
    <div 
      v-if="hasDetailedPreview && !largeImageFailed"
      :class="['hover-preview-overlay', { 'visible': isHovering }]"
    >
      <!-- Header with Media ID -->
      <div class="preview-header">
        <strong>M{{ mediaId }}</strong>
      </div>
      
      <div class="preview-content">
        <!-- Left: Large Image -->
        <div class="preview-image-container">
          <div class="preview-loading" v-if="!isLargeImageLoaded">
            <div class="preview-spinner"></div>
          </div>
          <img 
            :src="largeImageUrl!"
            :class="['preview-image', { 'loaded': isLargeImageLoaded }]"
            @load="onLargeImageLoad"
            @error="onLargeImageError"
            alt="Large preview"
          />
        </div>
        
        <!-- Right: Metadata Fields -->
        <div class="preview-metadata">
          <div class="metadata-row" v-if="taxon">
            <span class="metadata-label">Taxon:</span>
            <span class="metadata-value">
              <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
            </span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">Specimen:</span>
            <span class="metadata-value">{{ specimenName || 'NA' }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">View:</span>
            <span class="metadata-value">{{ viewName || 'NA' }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">Side:</span>
            <span class="metadata-value">{{ getSideName(mediaData?.is_sided) }}</span>
          </div>
          
          <div class="metadata-row" v-if="copyrightImagePath">
            <img 
              :src="`/images/${copyrightImagePath}.png`" 
              :alt="copyrightTitle"
              :title="copyrightTitle"
              class="copyright-badge"
            />
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">URL of media:</span>
            <span class="metadata-value truncate">{{ mediaData?.url || 'NA' }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">URL Description:</span>
            <span class="metadata-value truncate">{{ mediaData?.url_description || 'NA' }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">Access:</span>
            <span class="metadata-value">{{ getAccessText(mediaData?.access) }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">Status:</span>
            <span class="metadata-value">{{ getStatusText(mediaData?.published) }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">Media notes:</span>
            <span class="metadata-value truncate">{{ mediaData?.notes || 'NA' }}</span>
          </div>
          
          <div class="metadata-row">
            <span class="metadata-label">Original Filename:</span>
            <span class="metadata-value truncate">{{ extractOriginalFilename(mediaData) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.loading {
  background-size: 20px;
  background-repeat: no-repeat;
  background-image: url('/images/loader.png');
  background-position: 10px 10px;
}

.card-image {
  height: 8rem;
  margin: 5px auto;
  cursor: pointer;
}

.thumbnail-image {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card-image:hover .thumbnail-image {
  transform: scale(1.02);
}

.card-text {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  padding: 0.25rem 0.5rem;
}

.card-text > div {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center;
  width: 100%;
}

.mediaCard {
  background-color: rgba(248, 249, 250);
  width: 12rem;
  height: 15rem;
  font-size: 12px;
  position: relative;
}

/* Ensure TaxonomicName inherits the card's font size */
.mediaCard :deep(.taxonName) {
  font-size: inherit;
}
/* Ensure italic tags inside TaxonomicName still work */
.mediaCard :deep(.taxonName i) {
  font-style: italic !important;
}

/* Detailed Hover Preview Card Styles */
.hover-preview-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  background: white;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3), 0 6px 24px rgba(0, 0, 0, 0.2);
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  min-width: 550px;
  max-width: 650px;
  overflow: hidden;
}

.hover-preview-overlay.visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  pointer-events: none;
}

.preview-header {
  background-color: #f8f9fa;
  padding: 10px 16px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
}

.preview-content {
  display: flex;
  padding: 16px;
  gap: 20px;
}

.preview-image-container {
  flex-shrink: 0;
  width: 250px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 4px;
  position: relative;
}

.preview-image {
  max-width: 250px;
  max-height: 300px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.preview-image.loaded {
  opacity: 1;
}

.preview-loading {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top-color: #0d6efd;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-metadata {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  min-width: 0;
}

.metadata-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.4;
}

.metadata-label {
  font-weight: 600;
  color: #495057;
  flex-shrink: 0;
}

.metadata-value {
  color: #6c757d;
  word-break: break-word;
}

.metadata-value.truncate {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.copyright-badge {
  max-width: 88px;
  height: auto;
  object-fit: contain;
}
</style>
