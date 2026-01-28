<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { buildMediaUrl } from '@/utils/fileUtils.js'

const props = defineProps({
  media: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: 'Affected Media'
  },
  show: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['close', 'confirm'])

// Pagination
const currentPage = ref(1)
const itemsPerPage = 12

const totalPages = computed(() => {
  return Math.ceil(props.media.length / itemsPerPage)
})

const paginatedMedia = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.media.slice(start, end)
})

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function close() {
  currentPage.value = 1
  emit('close')
}

function confirm() {
  currentPage.value = 1
  emit('confirm')
}

// Get thumbnail URL for media
function getThumbnailUrl(mediaItem) {
  if (mediaItem.media_id && props.projectId) {
    return buildMediaUrl(props.projectId, mediaItem.media_id, 'thumbnail')
  }
  return null
}

// Handle escape key to close modal
function handleEscape(event) {
  if (event.key === 'Escape' && props.show) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="preview-modal">
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="fa-solid fa-images me-2"></i>
          {{ title }}
        </h5>
        <button type="button" class="btn-close" @click="close"></button>
      </div>
      
      <div class="modal-body">
        <div class="media-count mb-3">
          <span class="badge bg-primary">
            {{ media.length }} media file{{ media.length !== 1 ? 's' : '' }}
          </span>
          will be affected by this operation.
        </div>
        
        <div v-if="media.length === 0" class="alert alert-info">
          No media files will be affected.
        </div>
        
        <div v-else class="media-grid">
          <div 
            v-for="item in paginatedMedia" 
            :key="item.media_id" 
            class="media-item"
          >
            <div class="media-thumbnail">
              <img
                v-if="getThumbnailUrl(item)"
                :src="getThumbnailUrl(item)"
                :alt="`Media ${item.media_id}`"
                loading="lazy"
              />
              <div v-else class="no-thumbnail">
                <i class="fa-solid fa-image"></i>
              </div>
            </div>
            <div class="media-info">
              <div class="media-id">M{{ item.media_id }}</div>
              <div v-if="item.view_name" class="media-view text-muted">
                {{ item.view_name }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination-controls mt-3">
          <button 
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="currentPage === 1"
            @click="prevPage"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="page-info mx-3">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" @click="close">
          <i class="fa-solid fa-times me-1"></i>
          Close Preview
        </button>
        <button 
          type="button" 
          class="btn btn-primary"
          :disabled="media.length === 0"
          @click="confirm"
        >
          <i class="fa-solid fa-check me-2"></i>
          Confirm & Apply to {{ media.length }} Media
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.preview-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  max-height: 90vh;
  width: 90%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #dee2e6;
}

.media-count {
  font-size: 0.95rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.media-item {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
  background: #f8f9fa;
}

.media-thumbnail {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
}

.media-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumbnail {
  color: #6c757d;
  font-size: 1.5rem;
}

.media-info {
  padding: 0.5rem;
  text-align: center;
}

.media-id {
  font-weight: 500;
  font-size: 0.85rem;
}

.media-view {
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-info {
  font-size: 0.875rem;
}
</style>

