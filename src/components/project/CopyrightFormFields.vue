<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import { useCopyrightAutopopulate } from '@/composables/useCopyrightAutopopulate.js'
import Checkbox from '@/components/project/Checkbox.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import CopyrightDocumentSelector from '@/components/project/CopyrightDocumentSelector.vue'
import BulkApplyCopyright from '@/components/project/BulkApplyCopyright.vue'

const props = defineProps({
  // Initial values for editing existing media
  initialIsCopyrighted: {
    type: [Boolean, Number, String],
    default: false
  },
  initialCopyrightPermission: {
    type: [Number, String],
    default: 0
  },
  initialCopyrightLicense: {
    type: [Number, String],
    default: 0
  },
  initialCopyrightInfo: {
    type: String,
    default: ''
  },
  // Document ID for permission type 2
  initialDocumentId: {
    type: [Number, String],
    default: null
  },
  // Media ID for document linking (required for edit views)
  mediaId: {
    type: [Number, String],
    default: null
  },
  // Whether fields should be disabled (for access control)
  disabled: {
    type: Boolean,
    default: false
  },
  // Show bulk apply options (for edit views with specimen/citations)
  showBulkApply: {
    type: Boolean,
    default: false
  },
  // Specimen ID for bulk apply (from media being edited)
  specimenId: {
    type: [Number, String],
    default: null
  },
  // Whether the media has citations/bibliographic references
  hasCitations: {
    type: Boolean,
    default: false
  },
  // Enable auto-populate feature (for create views)
  enableAutopopulate: {
    type: Boolean,
    default: false
  },
  // Specimen ID for auto-populate (from form selection)
  specimenIdForAutopopulate: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits([
  'update:isCopyrighted',
  'update:copyrightPermission',
  'update:copyrightLicense',
  'update:copyrightInfo',
  'update:documentId',
  'bulk-applied'
])

const authStore = useAuthStore()

// Auto-populate composable
const autopopulate = props.enableAutopopulate ? useCopyrightAutopopulate() : null

// Reactive state
const isCopyrighted = ref(false)
const copyrightPermission = ref(0)
const copyrightLicense = ref(0)
const copyrightInfo = ref('')
const documentId = ref(null)

// Track if copyright was auto-populated (for UI indicator)
const wasAutopopulated = ref(false)
const isAutopopulating = ref(false)

// Copyright permission options
const copyrightPermissionOptions = {
  'Copyright permission not set': 0,
  'Person loading media owns copyright and grants permission for use of media on MorphoBank': 1,
  'Permission to use media on MorphoBank granted by copyright holder': 2,
  'Permission pending': 3,
  'Copyright expired or work otherwise in public domain': 4,
  'Copyright permission not yet requested': 5
}

// Copyright license options
const copyrightLicenseOptions = {
  'Media reuse policy not set': 0,
  'CC0 - relinquish copyright': 1,
  'Attribution CC BY - reuse with attribution': 2,
  'Attribution-NonCommercial CC BY-NC - reuse but noncommercial': 3,
  'Attribution-ShareAlike CC BY-SA - reuse here and applied to future uses': 4,
  'Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial': 5,
  'Attribution-NoDerivs CC BY-ND - reuse but no changes': 6,
  'Attribution-NonCommercial-NoDerivs CC BY-NC-ND - reuse noncommerical no changes': 7,
  'Media released for onetime use, no reuse without permission': 8,
  'Unknown - Will set before project publication': 20
}

// Computed: Show license field (hide when permission=4 - expired/public domain)
const showLicenseField = computed(() => {
  const permValue = parseInt(copyrightPermission.value, 10)
  return permValue !== 4
})

// Computed: Show document selector (when permission=2 - permission granted by holder)
const showDocumentSelector = computed(() => {
  const permValue = parseInt(copyrightPermission.value, 10)
  return permValue === 2
})

// Initialize values from props
onMounted(() => {
  // Ensure auth store is loaded
  if (!authStore.user?.name) {
    authStore.fetchLocalStore()
  }
  
  // Initialize state from props
  const initialCopyrightedVal = props.initialIsCopyrighted
  isCopyrighted.value = initialCopyrightedVal === true || 
                        initialCopyrightedVal === 1 || 
                        initialCopyrightedVal === '1'
  
  copyrightPermission.value = parseInt(props.initialCopyrightPermission, 10) || 0
  copyrightLicense.value = parseInt(props.initialCopyrightLicense, 10) || 0
  copyrightInfo.value = props.initialCopyrightInfo || ''
  documentId.value = props.initialDocumentId || null
})

// Watch for prop changes (for edit view when media data loads)
watch(() => props.initialIsCopyrighted, (newVal) => {
  isCopyrighted.value = newVal === true || newVal === 1 || newVal === '1'
})

watch(() => props.initialCopyrightPermission, (newVal) => {
  copyrightPermission.value = parseInt(newVal, 10) || 0
})

watch(() => props.initialCopyrightLicense, (newVal) => {
  copyrightLicense.value = parseInt(newVal, 10) || 0
})

watch(() => props.initialCopyrightInfo, (newVal) => {
  copyrightInfo.value = newVal || ''
})

watch(() => props.initialDocumentId, (newVal) => {
  documentId.value = newVal || null
})

// Auto-populate function - extracted so it can be called from multiple watchers
async function tryAutopopulateCopyright() {
  // Reset the success indicator whenever specimen changes
  // This must happen before any early returns to prevent stale success messages
  wasAutopopulated.value = false
  
  // Only auto-populate if:
  // 1. Feature is enabled (autopopulate exists and toggle is ON)
  // 2. Specimen ID is provided
  // 3. We're in create mode (no mediaId means create mode)
  if (!autopopulate || !autopopulate.isEnabled.value || !props.specimenIdForAutopopulate || props.mediaId) {
    return
  }
  
  // Don't auto-populate if user has manually changed values from defaults
  // Defaults in create mode: isCopyrighted=false, permission=4, license=1, info=''
  const isAtDefaults = !isCopyrighted.value && 
                       copyrightPermission.value === 4 && 
                       copyrightLicense.value === 1 && 
                       copyrightInfo.value.trim() === ''
  
  if (!isAtDefaults) {
    // User has manually changed values, don't overwrite
    return
  }
  
  // Capture the specimen ID to detect race conditions
  const specimenIdAtStart = props.specimenIdForAutopopulate
  
  isAutopopulating.value = true
  
  try {
    const copyright = await autopopulate.fetchCopyrightForSpecimen(specimenIdAtStart)
    
    // Race condition check: verify the specimen hasn't changed while the request was in flight
    if (specimenIdAtStart !== props.specimenIdForAutopopulate) {
      // Specimen changed while fetching, discard these results
      return
    }
    
    if (copyright) {
      // Auto-populate the fields
      isCopyrighted.value = copyright.is_copyrighted === 1 || copyright.is_copyrighted === true
      copyrightPermission.value = parseInt(copyright.copyright_permission, 10) || 0
      copyrightLicense.value = parseInt(copyright.copyright_license, 10) || 0
      copyrightInfo.value = copyright.copyright_info || ''
      
      // Emit updates
      emit('update:isCopyrighted', isCopyrighted.value)
      emit('update:copyrightPermission', copyrightPermission.value)
      emit('update:copyrightLicense', copyrightLicense.value)
      emit('update:copyrightInfo', copyrightInfo.value)
      
      wasAutopopulated.value = true
    }
  } catch (error) {
    console.error('Error auto-populating copyright:', error)
    wasAutopopulated.value = false
  } finally {
    isAutopopulating.value = false
  }
}

// Auto-populate when specimen is selected (and toggle is already ON)
watch(() => props.specimenIdForAutopopulate, () => {
  tryAutopopulateCopyright()
}, { immediate: false })

// Handle auto-populate toggle click - toggle state AND trigger auto-populate
function handleAutopopulateToggle() {
  if (!autopopulate) return
  autopopulate.toggle()
  // After toggling, if now enabled, try to auto-populate
  // We need to check the NEW state after toggle
  if (autopopulate.isEnabled.value) {
    tryAutopopulateCopyright()
  }
}

// Handle copyright checkbox change
function handleCopyrightChange(event) {
  isCopyrighted.value = event.target.checked
  emit('update:isCopyrighted', isCopyrighted.value)
  
  if (isCopyrighted.value) {
    // When checked, reset to "not set" options
    copyrightPermission.value = 0
    copyrightLicense.value = 0
    emit('update:copyrightPermission', 0)
    emit('update:copyrightLicense', 0)
  } else {
    // When unchecked, set default values (public domain)
    copyrightPermission.value = 4 // Copyright expired or work otherwise in public domain
    copyrightLicense.value = 1 // CC0 - relinquish copyright
    copyrightInfo.value = ''
    documentId.value = null
    emit('update:copyrightPermission', 4)
    emit('update:copyrightLicense', 1)
    emit('update:copyrightInfo', '')
    emit('update:documentId', null)
  }
}

// Handle copyright permission change
function handlePermissionChange(event) {
  const newValue = parseInt(event.target.value, 10)
  const oldValue = copyrightPermission.value
  copyrightPermission.value = newValue
  emit('update:copyrightPermission', newValue)
  
  // Auto-fill copyright holder when user owns copyright (permission=1)
  if (newValue === 1 && authStore.user?.name) {
    copyrightInfo.value = authStore.user.name
    emit('update:copyrightInfo', authStore.user.name)
  }
  
  // Clear document ID when permission changes from 2
  if (oldValue === 2 && newValue !== 2) {
    documentId.value = null
    emit('update:documentId', null)
  }
}

// Handle license change
function handleLicenseChange(event) {
  copyrightLicense.value = parseInt(event.target.value, 10)
  emit('update:copyrightLicense', copyrightLicense.value)
}

// Handle copyright info change
function handleCopyrightInfoChange(event) {
  copyrightInfo.value = event.target.value
  emit('update:copyrightInfo', copyrightInfo.value)
}

// Handle document ID change from selector
function handleDocumentChange(newDocumentId) {
  documentId.value = newDocumentId
  emit('update:documentId', newDocumentId)
}

// Expose validation method
function validate() {
  const errors = []
  
  if (isCopyrighted.value) {
    const permValue = parseInt(copyrightPermission.value, 10)
    const licValue = parseInt(copyrightLicense.value, 10)
    
    // Permission must be set
    if (isNaN(permValue) || permValue === 0) {
      errors.push('Copyright permission must be selected when media is under copyright')
    }
    
    // Permission 4 (expired) is contradictory when copyright is checked
    if (permValue === 4) {
      errors.push('Cannot select "Copyright expired or work otherwise in public domain" when media is under copyright')
    }
    
    // License must be set (unless permission is 3, 4, or 5 where it might not be needed yet)
    if (showLicenseField.value && (isNaN(licValue) || licValue === 0)) {
      errors.push('Media reuse license must be selected when media is under copyright')
    }
    
    // CC0 is contradictory when copyright is checked
    if (licValue === 1) {
      errors.push('Cannot select "CC0 - relinquish copyright" when media is under copyright')
    }
    
    // Copyright holder required for permissions 2, 3, 5
    if ([2, 3, 5].includes(permValue) && !copyrightInfo.value?.trim()) {
      errors.push('Copyright holder must be entered for this permission type')
    }
  }
  
  return errors
}

// Computed: detect if form has unsaved changes compared to initial props
// This is used to warn users before bulk applying (which reads from database, not form state)
const hasUnsavedChanges = computed(() => {
  // Normalize initial copyrighted value
  const initialCopyrightedVal = props.initialIsCopyrighted === true || 
                                props.initialIsCopyrighted === 1 || 
                                props.initialIsCopyrighted === '1'
  
  // Compare current form values with initial props
  // Use || 0 fallback to match initialization logic (parseInt returns NaN for null/undefined)
  const copyrightedChanged = isCopyrighted.value !== initialCopyrightedVal
  const permissionChanged = copyrightPermission.value !== (parseInt(props.initialCopyrightPermission, 10) || 0)
  const licenseChanged = copyrightLicense.value !== (parseInt(props.initialCopyrightLicense, 10) || 0)
  const infoChanged = copyrightInfo.value !== (props.initialCopyrightInfo || '')
  
  // Track document ID changes (relevant when permission type is 2)
  // Normalize both values to null for comparison (handle undefined, null, empty string, etc.)
  const currentDocId = documentId.value || null
  const initialDocId = props.initialDocumentId || null
  const documentChanged = currentDocId !== initialDocId
  
  return copyrightedChanged || permissionChanged || licenseChanged || infoChanged || documentChanged
})

// Expose the validate method and current values
defineExpose({
  validate,
  isCopyrighted,
  copyrightPermission,
  copyrightLicense,
  copyrightInfo,
  documentId,
  hasUnsavedChanges
})
</script>

<template>
  <div class="copyright-form-fields">
    <!-- Auto-populate Toggle (only shown in create mode) -->
    <div v-if="enableAutopopulate && autopopulate" class="autopopulate-section">
      <div class="autopopulate-toggle">
        <input
          type="checkbox"
          class="form-check-input"
          id="autopopulateCopyright"
          :checked="autopopulate.isEnabled.value"
          :disabled="disabled"
          @change="handleAutopopulateToggle"
        />
        <label class="autopopulate-label" for="autopopulateCopyright">
          <span class="autopopulate-title">Auto-populate copyright</span>
          <span class="autopopulate-description">
            Copy copyright settings from previously uploaded images of the same specimen (empty if no copyright is found for the specimen)
          </span>
        </label>
      </div>
      <div v-if="isAutopopulating" class="autopopulate-status">
        <i class="fa fa-spinner fa-spin"></i>
        <span>Checking for existing copyright...</span>
      </div>
      <div v-else-if="wasAutopopulated" class="autopopulate-status autopopulate-success">
        <i class="fa-solid fa-check-circle"></i>
        <span>Copyright settings copied from existing images</span>
      </div>
    </div>
    
    <!-- Is Copyrighted Checkbox -->
    <div class="form-group">
      <label class="form-label">
        Is under copyright?
      </label>
      <div class="form-check">
        <input
          type="checkbox"
          class="form-check-input"
          name="is_copyrighted"
          :value="1"
          :checked="isCopyrighted"
          :disabled="disabled"
          @change="handleCopyrightChange"
        />
        <span class="form-check-label">
          <small class="text-muted">
            MorphoBank places no copyright claim on site content and we encourage open data sharing. 
            Leave this box blank if the owner of the media you are loading wants to release those media 
            to the public domain (a CC0 designation). Check it to apply different sharing licenses.
          </small>
        </span>
      </div>
    </div>

    <!-- Copyright Fields (shown when copyrighted) -->
    <div v-if="isCopyrighted" class="copyright-details mt-3">
      <!-- Copyright Permission -->
      <div class="form-group mb-3">
        <label class="form-label">Copyright permission</label>
        <select
          class="form-select"
          name="copyright_permission"
          :value="copyrightPermission"
          :disabled="disabled"
          @change="handlePermissionChange"
        >
          <option
            v-for="(value, label) in copyrightPermissionOptions"
            :key="value"
            :value="value"
          >
            {{ label }}
          </option>
        </select>
      </div>

      <!-- Copyright License (hidden when permission=4) -->
      <div v-if="showLicenseField" class="form-group mb-3">
        <label class="form-label">Media reuse license</label>
        <select
          class="form-select"
          name="copyright_license"
          :value="copyrightLicense"
          :disabled="disabled"
          @change="handleLicenseChange"
        >
          <option
            v-for="(value, label) in copyrightLicenseOptions"
            :key="value"
            :value="value"
          >
            {{ label }}
          </option>
        </select>
        <small class="text-muted d-block mt-1">
          MorphoBank prefers CC0 or CC-BY licences because they are Open Data licenses.
          NC (non-commercial usage only) licenses prevent use on Wikipedia and similar sites.
        </small>
      </div>

      <!-- Document Selector (shown when permission=2) -->
      <div v-if="showDocumentSelector" class="form-group mb-3">
        <label class="form-label">Copyright Document</label>
        <!-- Full document selector for edit views (when mediaId is available) -->
        <CopyrightDocumentSelector
          v-if="mediaId"
          :media-id="mediaId"
          :disabled="disabled"
          @update:document-id="handleDocumentChange"
        />
        <!-- Info message for create views (no mediaId yet) -->
        <div v-else class="alert alert-info py-2">
          <i class="fa-solid fa-info-circle me-2"></i>
          <small>
            After creating this media, you can attach a copyright document 
            (e.g., permission letter, signed agreement) from the edit page.
          </small>
        </div>
        <!-- Hidden field for document_id -->
        <input type="hidden" name="document_id" :value="documentId || ''" />
      </div>

      <!-- Copyright Holder -->
      <div class="form-group mb-3">
        <label class="form-label">
          Copyright holder
          <span v-if="[2, 3, 5].includes(parseInt(copyrightPermission, 10))" class="required">Required</span>
        </label>
        <textarea
          class="form-control"
          name="copyright_info"
          rows="2"
          :value="copyrightInfo"
          :disabled="disabled"
          @input="handleCopyrightInfoChange"
          placeholder="Enter the name of the copyright holder"
        ></textarea>
        <small v-if="copyrightPermission == 1" class="text-muted d-block mt-1">
          <i class="fa-solid fa-check-circle text-success me-1"></i>
          Auto-filled with your name since you own the copyright.
        </small>
      </div>
    </div>

    <!-- Hidden fields for non-copyrighted state (to ensure values are submitted) -->
    <div v-else>
      <input type="hidden" name="copyright_permission" :value="copyrightPermission" />
      <input type="hidden" name="copyright_license" :value="copyrightLicense" />
      <input type="hidden" name="copyright_info" value="" />
    </div>
    
    <!-- Bulk Apply Copyright (only in edit mode with valid mediaId) -->
    <BulkApplyCopyright
      v-if="showBulkApply && mediaId"
      :media-id="mediaId"
      :specimen-id="specimenId"
      :has-citations="hasCitations"
      :copyright-info="copyrightInfo"
      :disabled="disabled"
      :has-unsaved-changes="hasUnsavedChanges"
      @applied="$emit('bulk-applied', $event)"
    />
  </div>
</template>

<style scoped>
.copyright-form-fields .form-label {
  font-weight: bold;
}

.copyright-details {
  padding-left: 0.5rem;
  border-left: 3px solid #dee2e6;
}

.required {
  color: #dc3545;
  font-size: 0.875rem;
  font-weight: normal;
}

.required::before {
  content: '* ';
}

/* Auto-populate section styles */
.autopopulate-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.autopopulate-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.autopopulate-toggle .form-check-input {
  margin-top: 0.25rem;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.autopopulate-toggle .form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.autopopulate-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.autopopulate-title {
  font-weight: 600;
  color: #212529;
  font-size: 0.95rem;
}

.autopopulate-description {
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.4;
}

.autopopulate-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #6c757d;
}

.autopopulate-status i {
  font-size: 0.9rem;
}

.autopopulate-status.autopopulate-success {
  color: #198754;
  background: #d1e7dd;
}

.autopopulate-status.autopopulate-success i {
  color: #198754;
}
</style>

