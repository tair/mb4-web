<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiService } from '@/services/apiService.js'
import { useNotifications } from '@/composables/useNotifications'
import AffectedMediaPreview from '@/components/project/AffectedMediaPreview.vue'

const props = defineProps({
  mediaId: {
    type: [Number, String],
    required: true
  },
  specimenId: {
    type: [Number, String],
    default: null
  },
  hasCitations: {
    type: Boolean,
    default: false
  },
  copyrightInfo: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // Whether the parent form has unsaved changes
  hasUnsavedChanges: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['applied'])

const route = useRoute()
const projectId = computed(() => route.params.id)
const { showError, showSuccess } = useNotifications()

// State
const isApplying = ref(false)
const isLoadingSpecimen = ref(false)
const isLoadingCitations = ref(false)
const applyToSpecimen = ref(false)
const applyToCitations = ref(false)
const applyHolderOnly = ref(false)
const includeDocument = ref(true)

// Related media
const specimenMedia = ref([])
const citationMedia = ref([])
const specimenMediaLoaded = ref(false)
const citationMediaLoaded = ref(false)

// Track which mediaId each in-flight request was started for
// This prevents stale responses from overwriting state after mediaId changes
const specimenRequestMediaId = ref(null)
const citationRequestMediaId = ref(null)

// Computed loading state - true when any async operation is in progress
const isLoading = computed(() => isApplying.value || isLoadingSpecimen.value || isLoadingCitations.value)

// Preview modal
const showPreview = ref(false)
const previewMedia = ref([])
const previewTitle = ref('')
const previewAction = ref(null) // 'specimen', 'citations', or 'all'

// Computed
const hasSpecimen = computed(() => !!props.specimenId)

const canApplyToSpecimen = computed(() => {
  return hasSpecimen.value && !props.disabled
})

const canApplyToCitations = computed(() => {
  return props.hasCitations && !props.disabled
})

const selectedMediaCount = computed(() => {
  let count = 0
  if (applyToSpecimen.value) {
    count += specimenMedia.value.length
  }
  if (applyToCitations.value) {
    count += citationMedia.value.length
  }
  // Remove duplicates
  if (applyToSpecimen.value && applyToCitations.value) {
    const specimenIds = new Set(specimenMedia.value.map(m => m.media_id))
    count -= citationMedia.value.filter(m => specimenIds.has(m.media_id)).length
  }
  return count
})

const canApply = computed(() => {
  return selectedMediaCount.value > 0 && !isLoading.value && !props.disabled
})

// Fetch related media when options are selected
async function loadSpecimenMedia() {
  if (specimenMediaLoaded.value || !props.specimenId || !props.mediaId) return
  
  // Capture the mediaId at request start to detect stale responses
  const requestMediaId = props.mediaId
  specimenRequestMediaId.value = requestMediaId
  
  isLoadingSpecimen.value = true
  try {
    const response = await apiService.get(
      `/projects/${projectId.value}/media/${requestMediaId}/related/by-specimen`
    )
    const data = await response.json()
    
    // Only update state if mediaId hasn't changed during the request
    // This prevents stale data from overwriting state after navigation
    if (props.mediaId === requestMediaId) {
      specimenMedia.value = data.media || []
      specimenMediaLoaded.value = true
    }
  } catch (error) {
    // Only show error if still on the same media
    if (props.mediaId === requestMediaId) {
      console.error('Error loading specimen media:', error)
      showError('Failed to load related media')
    }
  } finally {
    // Only clear loading state if this was the active request
    if (specimenRequestMediaId.value === requestMediaId) {
      isLoadingSpecimen.value = false
    }
  }
}

async function loadCitationMedia() {
  if (citationMediaLoaded.value || !props.mediaId) return
  
  // Capture the mediaId at request start to detect stale responses
  const requestMediaId = props.mediaId
  citationRequestMediaId.value = requestMediaId
  
  isLoadingCitations.value = true
  try {
    const response = await apiService.get(
      `/projects/${projectId.value}/media/${requestMediaId}/related/by-citations`
    )
    const data = await response.json()
    
    // Only update state if mediaId hasn't changed during the request
    // This prevents stale data from overwriting state after navigation
    if (props.mediaId === requestMediaId) {
      citationMedia.value = data.media || []
      citationMediaLoaded.value = true
    }
  } catch (error) {
    // Only show error if still on the same media
    if (props.mediaId === requestMediaId) {
      console.error('Error loading citation media:', error)
      showError('Failed to load related media')
    }
  } finally {
    // Only clear loading state if this was the active request
    if (citationRequestMediaId.value === requestMediaId) {
      isLoadingCitations.value = false
    }
  }
}

// Reset all related state - only called when mediaId changes
function resetAllState() {
  applyToSpecimen.value = false
  applyToCitations.value = false
  specimenMedia.value = []
  citationMedia.value = []
  specimenMediaLoaded.value = false
  citationMediaLoaded.value = false
  
  // Clear request tracking to invalidate any in-flight requests
  // When they complete, they'll see the mediaId mismatch and discard results
  specimenRequestMediaId.value = null
  citationRequestMediaId.value = null
  isLoadingSpecimen.value = false
  isLoadingCitations.value = false
  
  // Reset apply state so the Apply button isn't stuck disabled
  // when navigating to a new media while an apply request is in-flight
  isApplying.value = false
  
  // Also reset preview state to prevent stale data mismatch
  // If preview remains open while mediaId changes, the displayed snapshot
  // would become outdated vs. the current specimenMedia/citationMedia arrays
  showPreview.value = false
  previewMedia.value = []
  previewTitle.value = ''
  previewAction.value = null
}

// Reset state when mediaId changes (viewing a different media file)
watch(() => props.mediaId, () => {
  resetAllState()
})

// Watch for checkbox changes to load data
// NOTE: We do NOT clear data when unchecking - keep it cached to avoid race conditions
watch(applyToSpecimen, (newVal) => {
  if (newVal && !specimenMediaLoaded.value) {
    loadSpecimenMedia()
  }
})

watch(applyToCitations, (newVal) => {
  if (newVal && !citationMediaLoaded.value) {
    loadCitationMedia()
  }
})

// Show preview of affected media
function showAffectedPreview(type) {
  if (type === 'specimen') {
    // Create a COPY of the array to prevent shared reference issues
    previewMedia.value = [...specimenMedia.value]
    previewTitle.value = 'Media with Same Specimen'
    previewAction.value = 'specimen'
  } else if (type === 'citations') {
    // Create a COPY of the array to prevent shared reference issues
    previewMedia.value = [...citationMedia.value]
    previewTitle.value = 'Media with Same Citations'
    previewAction.value = 'citations'
  }
  showPreview.value = true
}

// Apply copyright settings
// Optional `targetCategory` param: 'specimen', 'citations', or null/undefined for all checked
async function applySettings(targetCategory = null) {
  // Collect target media IDs (removing duplicates)
  const targetMediaIds = new Set()
  
  // If a specific category is provided, only apply to that category
  // Otherwise, apply to all checked checkboxes
  const applySpecimen = targetCategory === 'specimen' || (targetCategory === null && applyToSpecimen.value)
  const applyCitations = targetCategory === 'citations' || (targetCategory === null && applyToCitations.value)
  
  
  // First check: are any categories selected?
  if (!applySpecimen && !applyCitations) {
    showError('Please select at least one category to apply settings to')
    return
  }
  
  // Validate that data is loaded before trying to apply
  if (applySpecimen && !specimenMediaLoaded.value) {
    showError('Specimen media data is not loaded. Please try again.')
    return
  }
  if (applyCitations && !citationMediaLoaded.value) {
    showError('Citation media data is not loaded. Please try again.')
    return
  }
  
  if (applySpecimen) {
    specimenMedia.value.forEach(m => {
      if (m.media_id) {
        targetMediaIds.add(m.media_id)
      }
    })
  }
  if (applyCitations) {
    citationMedia.value.forEach(m => {
      if (m.media_id) {
        targetMediaIds.add(m.media_id)
      }
    })
  }
  
  if (targetMediaIds.size === 0) {
    // Provide more helpful error message
    if (applySpecimen && specimenMedia.value.length === 0) {
      showError('No specimen media found to apply settings to')
    } else if (applyCitations && citationMedia.value.length === 0) {
      showError('No citation media found to apply settings to')
    } else {
      showError('No valid media found to apply settings to')
    }
    return
  }
  
  isApplying.value = true
  
  try {
    const endpoint = applyHolderOnly.value 
      ? `/projects/${projectId.value}/media/${props.mediaId}/copyright-holder/apply`
      : `/projects/${projectId.value}/media/${props.mediaId}/copyright/apply`
    
    const body = {
      target_media_ids: Array.from(targetMediaIds)
    }
    
    if (!applyHolderOnly.value) {
      body.include_document = includeDocument.value
    }
    
    const response = await apiService.post(endpoint, body)
    const data = await response.json()
    
    if (data.success) {
      showSuccess(data.message || `Copyright settings applied to ${data.updatedCount} media files`)
      emit('applied', { count: data.updatedCount, holderOnly: applyHolderOnly.value })
      
      // Reset the checkbox for the applied category (or all if no specific category)
      if (targetCategory === 'specimen' || targetCategory === null) {
        applyToSpecimen.value = false
      }
      if (targetCategory === 'citations' || targetCategory === null) {
        applyToCitations.value = false
      }
    } else {
      showError(data.message || 'Failed to apply settings')
    }
  } catch (error) {
    console.error('Error applying copyright:', error)
    showError('Failed to apply copyright settings')
  } finally {
    isApplying.value = false
  }
}

// Handle preview confirm (apply from preview modal)
// Apply only to the previewed category, not all checked checkboxes
function handlePreviewConfirm() {
  showPreview.value = false
  applySettings(previewAction.value)
}
</script>

<template>
  <div class="bulk-apply-copyright">
    <div class="bulk-apply-header mb-2">
      <h6 class="mb-0">
        <i class="fa-solid fa-copy me-2"></i>
        Apply Copyright to Other Media
      </h6>
    </div>
    
    <div class="bulk-apply-options">
      <!-- Warning for unsaved changes -->
      <div v-if="hasUnsavedChanges" class="alert alert-info py-2 mb-3">
        <i class="fa-solid fa-info-circle me-2"></i>
        <strong>Note:</strong> 
        You have unsaved changes. Bulk apply will use the <em>saved</em> copyright settings from the database, 
        not your current form changes. Save first if you want to apply your new settings.
      </div>
      
      <!-- Apply to same specimen -->
      <div v-if="canApplyToSpecimen" class="form-check mb-2">
        <input
          type="checkbox"
          class="form-check-input"
          id="applyToSpecimen"
          v-model="applyToSpecimen"
          :disabled="disabled || isLoading"
        />
        <label class="form-check-label" for="applyToSpecimen">
          Apply to all media with the same specimen
          <span v-if="specimenMediaLoaded" class="badge bg-secondary ms-1">
            {{ specimenMedia.length }}
          </span>
        </label>
        <a
          v-if="specimenMediaLoaded && specimenMedia.length > 0"
          href="#"
          class="preview-link ms-2"
          @click.prevent="showAffectedPreview('specimen')"
        >
          <i class="fa-solid fa-eye"></i> Preview
        </a>
      </div>
      
      <!-- Apply to same citations -->
      <div v-if="canApplyToCitations" class="form-check mb-2">
        <input
          type="checkbox"
          class="form-check-input"
          id="applyToCitations"
          v-model="applyToCitations"
          :disabled="disabled || isLoading"
        />
        <label class="form-check-label" for="applyToCitations">
          Apply to all media with the same bibliographic references
          <span v-if="citationMediaLoaded" class="badge bg-secondary ms-1">
            {{ citationMedia.length }}
          </span>
        </label>
        <a
          v-if="citationMediaLoaded && citationMedia.length > 0"
          href="#"
          class="preview-link ms-2"
          @click.prevent="showAffectedPreview('citations')"
        >
          <i class="fa-solid fa-eye"></i> Preview
        </a>
      </div>
      
      <!-- No options available message -->
      <div 
        v-if="!canApplyToSpecimen && !canApplyToCitations" 
        class="text-muted small"
      >
        <i class="fa-solid fa-info-circle me-1"></i>
        Bulk apply is available when media has a specimen or bibliographic references.
      </div>
      
      <!-- Apply options -->
      <div v-if="canApplyToSpecimen || canApplyToCitations" class="apply-options mt-3">
        <div class="form-check mb-2">
          <input
            type="checkbox"
            class="form-check-input"
            id="applyHolderOnly"
            v-model="applyHolderOnly"
            :disabled="disabled || isLoading"
          />
          <label class="form-check-label" for="applyHolderOnly">
            Apply copyright holder only
            <small class="text-muted d-block">
              Only apply the copyright holder name, not the full copyright settings
            </small>
          </label>
        </div>
        
        <div v-if="!applyHolderOnly" class="form-check mb-3">
          <input
            type="checkbox"
            class="form-check-input"
            id="includeDocument"
            v-model="includeDocument"
            :disabled="disabled || isLoading"
          />
          <label class="form-check-label" for="includeDocument">
            Include linked copyright document
          </label>
        </div>
        
        <!-- Apply button -->
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="!canApply"
          @click="applySettings()"
        >
          <i class="fa-solid fa-copy me-1"></i>
          Apply to {{ selectedMediaCount }} Media
          <span v-if="isLoading">
            <i class="fa fa-spinner fa-spin ms-1"></i>
          </span>
        </button>
      </div>
    </div>
    
    <!-- Preview Modal -->
    <AffectedMediaPreview
      :show="showPreview"
      :media="previewMedia"
      :title="previewTitle"
      :project-id="projectId"
      @close="showPreview = false"
      @confirm="handlePreviewConfirm"
    />
  </div>
</template>

<style scoped>
.bulk-apply-copyright {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  margin-top: 1rem;
}

.bulk-apply-header h6 {
  color: #495057;
}

.preview-link {
  font-size: 0.85rem;
  color: #0d6efd;
  text-decoration: none;
}

.preview-link:hover {
  text-decoration: underline;
}

.apply-options {
  border-top: 1px solid #dee2e6;
  padding-top: 0.75rem;
}

.form-check-label small {
  font-size: 0.8rem;
}
</style>

