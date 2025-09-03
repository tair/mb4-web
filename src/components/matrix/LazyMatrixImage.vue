<template>
  <div 
    :class="['matrix-lazy-image', { 'has-multiple': imageUrls.length > 1 }]"
    @click="onImageClick"
  >
    <!-- Loading state -->
    <div v-if="isLoading" class="image-loading-placeholder">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Main image with lazy loading -->
    <v-lazy-image
      :key="currentImageUrl.url"
      :src="currentImageUrl.url"
      :src-placeholder="placeholderImage"
      :intersection-options="intersectionOptions"
      class="matrix-thumbnail-image"
      @intersect="onIntersect"
      @load="onImageLoad"
      @error="onImageError"
    />
    
    <!-- Navigation arrows for multiple images -->
    <!-- <div v-if="imageUrls.length > 1" class="image-navigation">
      <div 
        :class="['image-arrow', 'image-arrow-up', { 'image-arrow-dim': currentIndex === 0 }]"
        @mousedown.stop="navigateUp"
        :title="'▲'"
      ></div>
      <div 
        :class="['image-arrow', 'image-arrow-down', { 'image-arrow-dim': currentIndex === imageUrls.length - 1 }]"
        @mousedown.stop="navigateDown"
        :title="'▼'"
      ></div>
    </div> -->
    
    <!-- Image caption -->
    <div v-if="currentImageUrl.caption" class="image-caption">
      {{ currentImageUrl.caption }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VLazyImage from 'v-lazy-image'

interface ImageUrl {
  id: number
  url: string
  caption?: string | null
}

interface Props {
  imageUrls: ImageUrl[]
  type: string
  projectId: number | null
  cellId?: number | null
  readonly?: boolean
  published?: boolean
  placeholderImage?: string
  onImageClick?: (imageId: number, type: string, projectId: number | null, readonly: boolean, cellId: number | null, published: boolean) => void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  published: false,
  placeholderImage: '/images/loading-placeholder.svg'
})

const emit = defineEmits<{
  imageClick: [imageId: number, type: string, projectId: number | null, readonly: boolean, cellId: number | null, published: boolean]
}>()

// State
const currentIndex = ref(0)
const isLoading = ref(true)

// Computed
const currentImageUrl = computed(() => {
  return props.imageUrls[currentIndex.value] || { id: 0, url: '', caption: null }
})

// Intersection Observer options for lazy loading
const intersectionOptions = {
  rootMargin: '50px' // Start loading 50px before coming into view
}

// Methods
const onIntersect = () => {
  // Image is about to be loaded
  isLoading.value = true
}

const onImageLoad = () => {
  isLoading.value = false
}

const onImageError = () => {
  isLoading.value = false
  console.error('Failed to load matrix cell image:', currentImageUrl.value.url)
}

const navigateUp = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const navigateDown = () => {
  if (currentIndex.value < props.imageUrls.length - 1) {
    currentIndex.value++
  }
}

const onImageClick = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (props.imageUrls.length > 0) {
    if (props.onImageClick) {
      // Use provided click handler (from TypeScript integration)
      props.onImageClick(
        currentImageUrl.value.id,
        props.type,
        props.projectId,
        props.readonly,
        props.cellId || null,
        props.published
      )
    } else {
      // Emit event as fallback
      emit('imageClick', 
        currentImageUrl.value.id, 
        props.type, 
        props.projectId, 
        props.readonly,
        props.cellId || null,
        props.published
      )
    }
  }
}

// Watch for changes in imageUrls to reset index
watch(() => props.imageUrls, () => {
  currentIndex.value = 0
  isLoading.value = true
})
</script>

<style scoped>
/* Initial loading placeholder styles (for TypeScript component) */
:global(.initial-loading-placeholder) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  background-color: #f8f9fa;
  color: #6c757d;
  font-size: 11px;
  border-radius: 4px;
  position: relative;
}

:global(.initial-loading-placeholder::after) {
  content: '';
  width: 12px;
  height: 12px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-left: 8px;
}

:global(.no-images-placeholder) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  background-color: #f8f9fa;
  color: #adb5bd;
  font-size: 10px;
  border-radius: 4px;
}

.matrix-lazy-image {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
}

.matrix-lazy-image:hover {
  opacity: 0.9;
  transform: scale(1.02);
  transition: all 0.2s ease;
}

.image-loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(248, 249, 250, 0.9);
  z-index: 2;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.matrix-thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

/* Image navigation */
.image-navigation {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 3;
}

.image-arrow {
  width: 12px;
  height: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  cursor: pointer;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.image-arrow:hover:not(.image-arrow-dim) {
  background-color: rgba(0, 0, 0, 0.9);
}

.image-arrow-dim {
  opacity: 0.3;
  cursor: not-allowed;
}

.image-arrow-up::after {
  content: '▲';
  font-size: 6px;
}

.image-arrow-down::after {
  content: '▼';
  font-size: 6px;
}

.image-caption {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 4px;
  font-size: 10px;
  border-radius: 2px;
  text-align: center;
  z-index: 3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .matrix-lazy-image {
    min-height: 30px;
  }
  
  .image-arrow {
    width: 16px;
    height: 16px;
    font-size: 10px;
  }
  
  .image-caption {
    font-size: 9px;
  }
}
</style>
