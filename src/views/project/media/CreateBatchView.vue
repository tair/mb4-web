<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useNotifications } from '@/composables/useNotifications'
import { NavigationPatterns } from '@/utils/navigationUtils.js'
import { batchSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import CopyrightFormFields from '@/components/project/CopyrightFormFields.vue'

const route = useRoute()
const projectId = parseInt(route.params.id)

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)
const copyrightFormRef = ref(null)
const selectedSpecimenId = ref(null)

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

// Computed schema that excludes copyright fields (handled by CopyrightFormFields component)
const filteredBatchSchema = computed(() => {
  const schema = { ...batchSchema }
  // Remove copyright fields - they're handled by CopyrightFormFields component
  delete schema.is_copyrighted
  delete schema.copyright_permission
  delete schema.copyright_license
  delete schema.copyright_info
  return schema
})

function validateRequiredFields(formData) {
  const errors = []
  
  // Check required fields based on batchSchema (specimen and view are NOT required for batch)
  Object.entries(batchSchema).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      const value = formData.get(fieldName)
      
      // Special handling for file uploads
      if (fieldName === 'file') {
        if (!value || (value instanceof File && value.size === 0)) {
          errors.push(`${fieldDef.label} is required`)
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${fieldDef.label} is required`)
      }
    }
  })
  
  // Validate copyright fields using the component's validation
  if (copyrightFormRef.value) {
    const copyrightErrors = copyrightFormRef.value.validate()
    errors.push(...copyrightErrors)
  }
  
  return errors
}

// Handle specimen selection for auto-populate copyright feature
function handleSpecimenSelect(item) {
  selectedSpecimenId.value = item ? item.specimen_id : null
}

async function createBatch(event) {
  if (isSubmitting.value) return // Prevent double submission
  
  const formData = new FormData(event.currentTarget)
  
  // FIX: Explicitly set is_copyrighted to 0 if checkbox is unchecked
  if (!formData.has('is_copyrighted')) {
    formData.set('is_copyrighted', '0')
  }
  
  // Validate required fields
  const errors = validateRequiredFields(formData)
  if (errors.length > 0) {
    showError(errors.join('; '), 'Validation Error')
    return
  }

  isSubmitting.value = true

  try {
    const success = await mediaStore.createBatch(projectId, formData)
    if (!success) {
      showError('Failed to create batch media. Please check your input and try again.')
      return
    }

    showSuccess('Batch media uploaded successfully!')
    await NavigationPatterns.afterBatchOperation(projectId, 'media')
  } catch (error) {
    console.error('Batch upload error:', error)
    
    // Extract specific error messages from backend response
    let errorMessage = 'Failed to create media. Please try again.'
    
    // Check for timeout/gateway errors (502, 503, 504 or "Bad Gateway" message)
    const isTimeoutError = 
      error.response?.status === 502 || 
      error.response?.status === 503 || 
      error.response?.status === 504 ||
      error.message?.toLowerCase().includes('bad gateway') ||
      error.message?.toLowerCase().includes('gateway timeout') ||
      error.message?.toLowerCase().includes('timeout')
    
    if (isTimeoutError) {
      errorMessage = 'The batch upload timed out. This usually happens when the upload takes too long due to slow internet connection or a large batch size. Please try again with a smaller batch (fewer files in your ZIP archive).'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }
    
    // Display the error as notification
    showError(errorMessage, 'Batch Upload Failed')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (!mediaStore.isLoaded) {
    mediaStore.fetchMedia(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
})
</script>
<template>
  <header>
    <div class="text_block">
      <span style="font-size: 18px">
        <b>Add Batch of 2D Media</b>
        <b>Step 1:</b> Load a zipped media file <b>Step 2:</b> Curate
      </span>
      <span>
        Did you add your
        <RouterLink :to="`/myprojects/${projectId}/specimens/`"
          >specimens</RouterLink
        >
        and
        <RouterLink :to="`/myprojects/${projectId}/views/`">views</RouterLink>
        first?
      </span>
      <div>
        <strong>Note:</strong> Due to file size considerations you should upload
        3d media (PLY, STL, ZIP-format TIFF and DCM stacks) one at a time using
        the
        <RouterLink :to="`/myprojects/${projectId}/media/create`"
          >standard media upload form</RouterLink
        >
      </div>
      <div class="caution-box">
        <i class="fa fa-exclamation-triangle"></i>
        <strong>Caution:</strong> Batch uploads may fail due to timeout if your internet bandwidth is slow. 
        It is recommended to use smaller batches where possible. If you experience upload failures, 
        try reducing the number of files in your ZIP archive.
      </div>
    </div>
  </header>
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="createBatch">
      <div class="row setup-content">
        <!-- Non-copyright fields from schema -->
        <template v-for="(definition, fieldName) in filteredBatchSchema" :key="fieldName">
          <div v-if="!definition.existed" class="form-group">
            <label :for="fieldName" class="form-label">
              {{ definition.label }}
              <span v-if="definition.required" class="required">Required</span>
            </label>
            <component
              :is="definition.view"
              :name="fieldName"
              v-bind="definition.args"
              v-on="fieldName === 'specimen_id' ? { select: handleSpecimenSelect } : {}"
            >
            </component>
          </div>
        </template>
        
        <!-- Copyright Fields Component -->
        <div class="form-group">
          <CopyrightFormFields
            ref="copyrightFormRef"
            :initial-is-copyrighted="false"
            :initial-copyright-permission="4"
            :initial-copyright-license="1"
            :initial-copyright-info="''"
            :enable-autopopulate="true"
            :specimen-id-for-autopopulate="selectedSpecimenId"
          />
        </div>
        
        <div class="btn-form-group">
          <button 
            class="btn btn-outline-primary" 
            type="button" 
            @click="$router.go(-1)"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit" :disabled="isSubmitting">
            <span v-if="isSubmitting">
              <i class="fa fa-spinner fa-spin me-2"></i>
              Uploading Batch...
            </span>
            <span v-else>Upload Batch</span>
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped>
.form-label {
  font-weight: bold;
}

.caution-box {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 12px 16px;
  margin-top: 12px;
  color: #856404;
  font-size: 14px;
  line-height: 1.5;
}

.caution-box i {
  color: #e0a800;
  margin-right: 6px;
}
</style>
