<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { stacksSchema } from '@/views/project/media/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const isUploading = ref(false)
const validationErrors = ref([])

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
  
  // Check required fields based on schema
  Object.entries(stacksSchema).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      const value = formData.get(fieldName)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
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

async function createStacksMedia(event) {
  if (isUploading.value) return // Prevent double submission
  
  const formData = new FormData(event.currentTarget)
  
  // Validate required fields
  const errors = validateRequiredFields(formData)
  if (errors.length > 0) {
    validationErrors.value = errors
    return
  }
  
  // Clear any previous validation errors
  validationErrors.value = []
  
  isUploading.value = true
  try {
    const success = await mediaStore.createStacks(projectId, formData)
    if (!success) {
      alert('Failed to create stacks media')
      return
    }

    router.push({ path: `/myprojects/${projectId}/media` })
  } catch (error) {
    console.error('Stacks upload error:', error)
    alert('Failed to create stacks media')
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
          <b>Upload CT Scan Stacks</b>
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
      </div>
    </header>
    <div class="alert alert-info">
      <i class="fa fa-info-circle"></i>
      Upload a ZIP archive containing CT scan slices in DICOM (.dcm, .dicom) or TIFF (.tif, .tiff) formats. 
      Each slice will be stored as an individual media file that can be viewed using specialized medical imaging tools.
    </div>
    <form @submit.prevent="createStacksMedia">
      <div class="row setup-content">
        <!-- Display validation errors -->
        <div v-if="validationErrors.length > 0" class="alert alert-danger" role="alert">
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
        
        <template v-for="(definition, index) in stacksSchema" :key="index">
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
            :disabled="isUploading"
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit" :disabled="isUploading">
            <span v-if="isUploading">
              <i class="fa fa-spinner fa-spin"></i>
              Uploading Stacks...
            </span>
            <span v-else>Upload Stacks</span>
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped>
@import '@/views/project/steps.css';

.alert {
  padding: 12px 16px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.text_block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.text_block span:first-child {
  font-weight: bold;
}

.text_block a {
  color: #007bff;
  text-decoration: none;
}

.text_block a:hover {
  text-decoration: underline;
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-label {
  font-weight: bold;
}
</style>