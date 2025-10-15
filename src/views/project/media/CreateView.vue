<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useNotifications } from '@/composables/useNotifications'
import { NavigationPatterns } from '@/utils/navigationUtils.js'
import { createSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import '@/assets/css/form.css'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const projectsStore = useProjectsStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)
const formData = ref(new FormData())
const isCopyrighted = ref(false)
const copyrightPermissionValue = ref(4) // Default value from schema
const copyrightLicenseValue = ref(1) // Default value from schema

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

// Create a computed schema that uses reactive values
const dynamicCreateSchema = computed(() => {
  const schema = { ...createSchema }

  // Update copyright permission value
  if (schema.copyright_permission) {
    schema.copyright_permission = {
      ...schema.copyright_permission,
      args: {
        ...schema.copyright_permission.args,
        value: copyrightPermissionValue.value,
      },
    }
  }

  // Update copyright license value
  if (schema.copyright_license) {
    schema.copyright_license = {
      ...schema.copyright_license,
      args: {
        ...schema.copyright_license.args,
        value: copyrightLicenseValue.value,
      },
    }
  }

  return schema
})

// Helper function to validate file types and show errors for unsupported formats
function validateImageFile(file, fileType = 'media') {
  if (!file) return true
  
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.split('.').pop()
  
  // Check for HEIC files specifically
  if (fileExtension === 'heic' || fileExtension === 'heif') {
    showError(
      `HEIC/HEIF files are not supported. Please convert your ${fileType} to JPEG, PNG, or another supported format.`,
      'Unsupported File Format'
    )
    return false
  }
  
  return true
}

function validateRequiredFields(formData) {
  const errors = []

  // Check required fields based on createSchema
  Object.entries(createSchema).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      const value = formData.get(fieldName)

      // Special handling for file uploads
      if (fieldName === 'file') {
        if (!value || (value instanceof File && value.size === 0)) {
          errors.push(`${fieldDef.label} is required`)
        } else if (value instanceof File) {
          // Validate file format
          if (!validateImageFile(value, 'media file')) {
            errors.push('Please select a supported file format')
          }
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
    // Check copyright_permission - must not be the "not set" option (value 0)
    const copyrightPermission = formData.get('copyright_permission')
    const copyrightPermissionValue = parseInt(String(copyrightPermission), 10)

    if (isNaN(copyrightPermissionValue) || copyrightPermissionValue === 0) {
      errors.push(
        'Copyright permission must be selected when media is under copyright (cannot use "Copyright permission not set")'
      )
    }

    // Validate that copyright_permission is not contradictory
    // Value 4 = "Copyright expired or work otherwise in public domain"
    if (copyrightPermissionValue === 4) {
      errors.push('Cannot select "Copyright expired or work otherwise in public domain" when media is under copyright')
    }

    // Check copyright_license - must not be the "not set" option (value 0)
    const copyrightLicense = formData.get('copyright_license')
    const copyrightLicenseValue = parseInt(String(copyrightLicense), 10)

    if (isNaN(copyrightLicenseValue) || copyrightLicenseValue === 0) {
      errors.push(
        'Media reuse license must be selected when media is under copyright (cannot use "Media reuse policy not set")'
      )
    }

    // Validate that copyright_license is not contradictory
    // Value 1 = "CC0 - relinquish copyright"
    if (copyrightLicenseValue === 1) {
      errors.push('Cannot select "CC0 - relinquish copyright" when media is under copyright')
    }
  }

  return errors
}

function handleCopyrightChange(event) {
  isCopyrighted.value = event.target.checked

  if (isCopyrighted.value) {
    // When checked, set to "not set" options (value 0)
    copyrightPermissionValue.value = 0
    copyrightLicenseValue.value = 0
  } else {
    // When unchecked, revert to default values from schema
    copyrightPermissionValue.value = 4 // Default from schema
    copyrightLicenseValue.value = 1 // Default from schema
  }
}

async function createMedia(event) {
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

  // Check if this should be set as project exemplar
  const exemplarValue = formData.get('is_exemplar')
  const isExemplar =
    exemplarValue === 'on' ||
    exemplarValue === '1' ||
    exemplarValue === 1 ||
    exemplarValue === true

  // Remove the is_exemplar field from formData as the backend doesn't expect it
  formData.delete('is_exemplar')

  // Ensure copyright fields are always included with appropriate values
  if (!isCopyrighted.value) {
    // When not copyrighted, set the default values
    formData.set(
      'copyright_permission',
      copyrightPermissionValue.value.toString()
    )
    formData.set('copyright_license', copyrightLicenseValue.value.toString())
    // Don't set copyright_info when not copyrighted, or set it to empty
    formData.set('copyright_info', '')
  }
  // If copyrighted, the fields should already be in formData from the visible form

  try {
    const result = await mediaStore.create(projectId, formData)

    if (!result) {
      showError('Failed to create media. Please check your input and try again.')
      return
    }

    // If the media was created successfully and should be set as exemplar
    if (isExemplar && result && result.media_id) {
      try {
        // Set this media as the project exemplar
        const success = await projectsStore.setExemplarMedia(
          projectId,
          result.media_id
        )
        if (!success) {
          showError('Media created successfully, but failed to set as project exemplar', 'Warning')
        }
      } catch (error) {
        console.error('Failed to set exemplar media:', error)
        showError('Media created successfully, but failed to set as project exemplar', 'Warning')
      }
    }

    showSuccess('Media uploaded successfully!')
    await NavigationPatterns.afterComplexResourceCreate(projectId, 'media')
  } catch (error) {
    console.error('Media upload error:', error)

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
    showError(errorMessage, 'Media Upload Failed')
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
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="createMedia">
      <div class="row setup-content">
        <template
          v-for="(definition, index) in dynamicCreateSchema"
          :key="index"
        >
          <div
            v-if="
              !definition.existed &&
              ((index !== 'copyright_permission' &&
                index !== 'copyright_license' &&
                index !== 'copyright_info') ||
                isCopyrighted)
            "
            class="form-group"
          >
            <label :for="index" class="form-label">
              {{ definition.label }}
              <span v-if="definition.required" class="required">Required</span>
            </label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              v-bind="definition.args"
              @change="
                index === 'is_copyrighted'
                  ? handleCopyrightChange($event)
                  : null
              "
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
              Creating Media...
            </span>
            <span v-else>Create</span>
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
