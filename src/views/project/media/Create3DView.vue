<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema3D } from '@/views/project/media/schema.js'
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
  Object.entries(schema3D).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      const value = formData.get(fieldName)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${fieldDef.label} is required`)
      }
    }
  })
  
  return errors
}

async function create3DMedia(event) {
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
    const success = await mediaStore.create3D(projectId, formData)
    if (!success) {
      alert('Failed to create 3D media')
      return
    }

    router.push({ path: `/myprojects/${projectId}/media` })
  } catch (error) {
    console.error('3D upload error:', error)
    alert('Failed to create 3D media')
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
        <!-- Display validation errors -->
        <div v-if="validationErrors.length > 0" class="alert alert-danger" role="alert">
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
        <template v-for="(definition, index) in schema3D" :key="index">
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
              Uploading 3D Media...
            </span>
            <span v-else>Upload 3D Media</span>
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>