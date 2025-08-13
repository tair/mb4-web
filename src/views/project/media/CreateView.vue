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
import { schema } from '@/views/project/media/schema.js'
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
  Object.entries(schema).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      const value = formData.get(fieldName)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${fieldDef.label} is required`)
      }
    }
  })
  
  return errors
}

async function createMedia(event) {
  const formData = new FormData(event.currentTarget)
  
  // Validate required fields
  const errors = validateRequiredFields(formData)
  if (errors.length > 0) {
    validationErrors.value = errors
    return
  }
  
  // Clear any previous validation errors
  validationErrors.value = []
  
  // Check if this should be set as project exemplar
  const exemplarValue = formData.get('is_exemplar')
  const isExemplar = exemplarValue === 'on' || exemplarValue === '1' || exemplarValue === 1 || exemplarValue === true
  
  // Remove the is_exemplar field from formData as the backend doesn't expect it
  formData.delete('is_exemplar')
  
  const result = await mediaStore.create(projectId, formData)
  
  if (!result) {
    alert('Failed to create media')
    return
  }

  // If the media was created successfully and should be set as exemplar
  if (isExemplar && result && result.media_id) {
    try {
      // Set this media as the project exemplar
      const success = await projectsStore.setExemplarMedia(projectId, result.media_id)
      if (!success) {
        alert('Media created successfully, but failed to set as project exemplar')
      }
    } catch (error) {
      console.error('Failed to set exemplar media:', error)
      alert('Media created successfully, but failed to set as project exemplar')
    }
  }

  window.location.href = `/myprojects/${projectId}/media`
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
        <!-- Display validation errors -->
        <div v-if="validationErrors.length > 0" class="alert alert-danger" role="alert">
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
        
        <template v-for="(definition, index) in schema" :key="index">
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
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit">Create</button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
