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
import CopyrightFormFields from '@/components/project/CopyrightFormFields.vue'
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
const copyrightFormRef = ref(null)

const isLoaded = computed(
  () =>
    projectUsersStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

// Computed schema that excludes copyright fields (handled by CopyrightFormFields component)
const filteredCreateSchema = computed(() => {
  const schema = { ...createSchema }
  // Remove copyright fields - they're handled by CopyrightFormFields component
  delete schema.is_copyrighted
  delete schema.copyright_permission
  delete schema.copyright_license
  delete schema.copyright_info
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

  // Validate copyright fields using the component's validation
  if (copyrightFormRef.value) {
    const copyrightErrors = copyrightFormRef.value.validate()
    errors.push(...copyrightErrors)
  }

  return errors
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
        <!-- Non-copyright fields from schema -->
        <template
          v-for="(definition, index) in filteredCreateSchema"
          :key="index"
        >
          <div
            v-if="!definition.existed"
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
