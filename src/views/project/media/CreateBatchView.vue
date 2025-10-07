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

const route = useRoute()
const projectId = parseInt(route.params.id)

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)
const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

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
  
  // Conditional validation for copyright fields
  const copyrightCheckbox = formData.get('is_copyrighted')
  const isCopyrighted = copyrightCheckbox === '1' || copyrightCheckbox === 1
  
  if (isCopyrighted) {
    // Check copyright_permission - must not be the default "not set" option (value 0)
    const copyrightPermission = formData.get('copyright_permission')
    const copyrightPermissionValue = parseInt(String(copyrightPermission), 10)
    
    if (isNaN(copyrightPermissionValue) || copyrightPermissionValue === 0) {
      errors.push('Copyright permission must be selected when media is under copyright (cannot use "Copyright permission not set")')
    }
    
    // Check copyright_license - must not be the default "not set" option (value 0)
    const copyrightLicense = formData.get('copyright_license')
    const copyrightLicenseValue = parseInt(String(copyrightLicense), 10)
    
    if (isNaN(copyrightLicenseValue) || copyrightLicenseValue === 0) {
      errors.push('Media reuse license must be selected when media is under copyright (cannot use "Media reuse policy not set")')
    }
  }
  
  return errors
}

async function createBatch(event) {
  if (isSubmitting.value) return // Prevent double submission
  
  const formData = new FormData(event.currentTarget)
  
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
    
    if (error.response?.data?.message) {
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
    </div>
  </header>
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="createBatch">
      <div class="row setup-content">
        
        <template v-for="(definition, index) in batchSchema" :key="index">
          <div v-if="!definition.existed" class="form-group">
            <label :for="index" class="form-label">
              {{ definition.label }}
              <span v-if="definition.required" class="required">Required</span>
            </label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              v-bind="definition.args"
            >
            </component>
          </div>
        </template>
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
</style>
