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
import { schema3D } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import CopyrightFormFields from '@/components/project/CopyrightFormFields.vue'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess } = useNotifications()
const isUploading = ref(false)
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
const filteredSchema3D = computed(() => {
  const schema = { ...schema3D }
  // Remove copyright fields - they're handled by CopyrightFormFields component
  delete schema.is_copyrighted
  delete schema.copyright_permission
  delete schema.copyright_license
  delete schema.copyright_info
  return schema
})

function validateRequiredFields(formData) {
  const errors = []
  
  // Check required fields based on schema
  Object.entries(schema3D).forEach(([fieldName, fieldDef]) => {
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

async function create3DMedia(event) {
  if (isUploading.value) return // Prevent double submission
  
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
  
  isUploading.value = true
  try {
    const success = await mediaStore.create3D(projectId, formData)
    if (!success) {
      showError('Failed to create 3D media. Please check your input and try again.')
      return
    }

    showSuccess('3D media uploaded successfully!')
    router.push({ path: `/myprojects/${projectId}/media` })
  } catch (error) {
    console.error('3D upload error:', error)
    
    // Extract specific error messages from backend response
    let errorMessage = 'Failed to create 3D media. Please try again.'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }
    
    // Display the error as notification
    showError(errorMessage, '3D Upload Failed')
  } finally {
    isUploading.value = false
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
    <header>
      <div class="text_block">
        <span style="font-size: 18px">
          <b>Upload 3D Media</b>
        </span>
        <span>
          Did you add your
          <RouterLink :to="`/myprojects/${projectId}/specimens/`"
            >specimens</RouterLink
          >
          and
          <RouterLink :to="`/myprojects/${projectId}/views/`">views</RouterLink>
          first? <strong>Both specimen and view are required</strong> for automatic media release.
        </span>
        <div>
          <strong>Note:</strong> Supported 3D file formats include PLY, STL, OBJ, GLB, GLTF, and FBX.
          Files will be stored in the same S3 bucket as 2D media (mb4-data/media_files/images).
        </div>
      </div>
    </header>
    <form @submit.prevent="create3DMedia">
      <div class="row setup-content">
        <!-- Non-copyright fields from schema -->
        <template v-for="(definition, index) in filteredSchema3D" :key="index">
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
            :disabled="isUploading"
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit" :disabled="isUploading">
            <span v-if="isUploading">
              <i class="fa fa-spinner fa-spin"></i>
              Uploading 3D Media...
            </span>
            <span v-else>Upload 3D Media</span>
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