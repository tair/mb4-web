<script setup lang="ts">
import CopyrightIcon from '@/components/project/CopyrightIcon.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  taxon: any
  importText: string
  results: any
  fetchMoreMedia: () => void
}>()

const isLoadingMore = ref(false)
const moreMediaMessage = ref<string | null>(null)
const previousMediaCount = ref(0)
const noMoreMediaAvailable = ref(false)

// Track initial media count
onMounted(() => {
  previousMediaCount.value = props.results.media?.length || 0
})

// Watch for changes in media results to show success messages
watch(() => props.results.media?.length, (newCount: number, oldCount: number) => {
  if (oldCount && newCount && newCount > oldCount) {
    const additionalCount = newCount - oldCount
    moreMediaMessage.value = `Found ${additionalCount} additional media, totaling ${newCount} media`
    
    // Clear message after 5 seconds
    setTimeout(() => {
      moreMediaMessage.value = null
    }, 5000)
  }
})

function selectAllForImport(shouldImport = true, shouldAddAsExemplar = true) {
  for (const result of props.results.media) {
    result.should_import = shouldImport
    result.should_add_as_exemplar = shouldAddAsExemplar
  }
}

function selectedImport(media: any) {
  if (!media.should_import) {
    media.should_add_as_exemplar = false
  }
}

function selectedAddAsExemplar(media: any) {
  if (media.should_add_as_exemplar) {
    media.should_import = true
  }
}

async function handleFetchMoreMedia() {
  if (noMoreMediaAvailable.value) return
  
  isLoadingMore.value = true
  moreMediaMessage.value = null
  
  try {
    await props.fetchMoreMedia()
    // Success message will be handled by the watcher above when the media count changes
  } catch (error) {
    console.error('Error fetching more media:', error)
    
    // Handle special case: found media but < 12 (auto-disable after success)
    if (error.message === 'AUTO_DISABLE_AFTER_SUCCESS') {
      // Let the watcher show the success message, then auto-disable after a delay
      setTimeout(() => {
        noMoreMediaAvailable.value = true
      }, 3000) // Wait 3 seconds so user sees the success message first
      return // Don't show error message, let success message display
    }
    
    // Check if the error indicates no more media available
    if (error.message && error.message.includes('No additional media were found')) {
      noMoreMediaAvailable.value = true
      moreMediaMessage.value = 'No additional media were found'
    } else {
      moreMediaMessage.value = error.message || `There was a problem contacting ${props.importText}, please try your request again later`
    }
    
    // Clear error message after 8 seconds (but keep "no more media" message)
    if (!noMoreMediaAvailable.value) {
      setTimeout(() => {
        moreMediaMessage.value = null
      }, 8000)
    }
  } finally {
    isLoadingMore.value = false
  }
}
</script>
<template>
  <div class="importBox">
    <div class="mb-3">
      <h6 class="card-title mb-2">
        <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
      </h6>
    </div>

    <div v-if="results.media.length > 0">
      <div class="d-flex gap-2 mb-3">
        <button type="button" class="btn btn-outline-primary btn-sm" @click="selectAllForImport(true, false)">
          <i class="fa fa-check"></i>
          <span> Select for import</span>
        </button>
        <button type="button" class="btn btn-outline-primary btn-sm" @click="selectAllForImport(true, true)">
          <i class="fa fa-star"></i>
          <span> Select for import/exemplar</span>
        </button>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="selectAllForImport(false, false)">
          <i class="fa fa-times"></i>
          <span> Deselect all</span>
        </button>
        <button
          type="button"
          :class="[
            'btn btn-sm',
            noMoreMediaAvailable ? 'btn-secondary' : 'btn-outline-primary'
          ]"
          @click="handleFetchMoreMedia"
          :disabled="isLoadingMore || noMoreMediaAvailable"
          :title="noMoreMediaAvailable ? 'No more media available' : (isLoadingMore ? 'Loading additional media...' : '12 additional media will be imported at a time')"
        >
          <span v-if="noMoreMediaAvailable">
            <i class="fa fa-ban me-1"></i>
            No more media available
          </span>
          <span v-else-if="isLoadingMore">
            <i class="fa fa-spinner fa-spin me-1"></i>
            Loading...
          </span>
          <span v-else>
            <i class="fa fa-search me-1"></i>
            Check for more media on {{ importText }}
          </span>
        </button>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="moreMediaMessage" :class="[
        'alert mb-3',
        moreMediaMessage.includes('Found') ? 'alert-success' : 'alert-warning'
      ]" role="alert">
        <i :class="[
          'me-2 fa',
          moreMediaMessage.includes('Found') ? 'fa-check-circle' : 'fa-info-circle'
        ]"></i>
        {{ moreMediaMessage }}
      </div>

    <div v-if="results.media.length > 0" class="mediaBoxList">
      <div v-for="media in results.media" class="mediaBox" :key="media.id">
        <div v-if="media.imported" class="alert alert-info py-2 px-3 mb-2">
          <i class="fa fa-check-circle me-1"></i>
          Already Imported
        </div>
        <div v-else class="mediaBoxImport mb-3">
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="media.should_import"
              @change="selectedImport(media)"
              :id="`import-${media.id}`"
            />
            <label class="form-check-label" :for="`import-${media.id}`">
              Select for import
            </label>
          </div>
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="media.should_add_as_exemplar"
              @change="selectedAddAsExemplar(media)"
              :id="`exemplar-${media.id}`"
            />
            <label class="form-check-label" :for="`exemplar-${media.id}`">
              Use image as taxon exemplar
            </label>
          </div>
        </div>
        <div class="media-image mb-2">
          <img :src="media.url" :alt="`Media for ${taxon?.genus || 'taxon'}`" />
        </div>
        <div v-if="media.copyright_license" class="mb-2">
          <CopyrightIcon
            :copyrightPermission="media.copyright_permission"
            :copyrightLicense="media.copyright_license"
          />
        </div>
        <div v-if="media.copyright_info?.name" class="copyrightHolder mb-2">
          <strong>Media Rights Holder:</strong>
          <div class="mt-1">
            <a
              v-if="media.copyright_info.url"
              :href="media.copyright_info.url"
              :title="media.copyright_info.name"
              target="_blank"
              class="text-primary"
            >
              {{ media.copyright_info.name }}
            </a>
            <span v-else :title="media.copyright_info.name">
              {{ media.copyright_info.name }}
            </span>
          </div>
        </div>
        <div v-if="media.source" class="mediaSource mb-2">
          <strong>Source:</strong>
          <div class="mt-1">
            <a
              v-if="media.source.url"
              :href="media.source.url"
              :title="media.source.name"
              target="_blank"
              class="text-primary"
            >
              {{ media.source.name }}
            </a>
            <span v-else :title="media.source.name">
              {{ media.source.name }}
            </span>
          </div>
        </div>
        <div v-if="media.link" class="mediaLink mb-2">
          <a :href="media.link" target="_blank" class="text-primary">
            <i class="fa fa-external-link me-1"></i>
            View on {{ importText }}
          </a>
        </div>
      </div>
    </div>
    </div>
    <div v-else class="empty alert alert-warning">
      <i class="fa fa-exclamation-triangle me-2"></i>
      <strong>No media were found on {{ importText }}</strong>
    </div>
  </div>
</template>
<style scoped>
.importBox {
  width: 100%;
  padding: 1rem;
}

.media-image {
  text-align: center;
}

.media-image img {
  display: block;
  height: auto;
  margin: 0 auto;
  max-height: 180px;
  max-width: 200px;
  object-fit: contain;
  width: auto;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mediaBoxList {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
}

.mediaBox {
  display: flex;
  flex-direction: column;
  width: 260px;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.15s ease-in-out;
}

.mediaBox:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mediaBoxImport {
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.75rem;
}

.copyrightHolder {
  font-size: 0.875rem;
  color: #6c757d;
}

.copyrightHolder strong {
  color: #495057;
  font-weight: 600;
}

.mediaSource {
  font-size: 0.875rem;
  color: #6c757d;
}

.mediaSource strong {
  color: #495057;
  font-weight: 600;
}

.mediaLink {
  font-size: 0.875rem;
}

.mediaLink a {
  color: #007bff;
  text-decoration: none;
}

.mediaLink a:hover {
  text-decoration: underline;
}

.empty {
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
}

.form-check-label {
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.card-title {
  color: #495057;
  font-weight: 600;
}
</style>
