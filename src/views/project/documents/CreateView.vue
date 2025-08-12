<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { documentSchema } from '@/views/project/documents/schema.js'
import { useNotifications } from '@/composables/useNotifications'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()
const { showError, showSuccess } = useNotifications()

const isCreating = ref(false)

async function createDocument(event) {
  if (isCreating.value) return // Prevent double-clicking
  
  isCreating.value = true
  
  try {
    const formData = new FormData(event.currentTarget)
    const result = await documentsStore.create(projectId, formData)
    
    if (!result.success) {
      showError(result.error || 'Failed to create document')
      isCreating.value = false // Reset loading state on error
      return
    }

    // Success - show notification and navigate away
    showSuccess('Document created successfully!')
    try {
      await router.push({ path: `/myprojects/${projectId}/documents` })
    } catch (navError) {
      console.error('Navigation failed:', navError)
      // Reset loading state if navigation fails
      isCreating.value = false
    }
  } catch (error) {
    console.error('Error creating document:', error)
    showError('Failed to create document. Please try again.')
    isCreating.value = false // Reset loading state on error
  }
}

onMounted(() => {
  if (!documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId)
  }
})
</script>
<template>
  <form @submit.prevent="createDocument">
    <div class="row setup-content">
      <template v-for="(definition, index) in documentSchema" :key="index">
        <div v-if="!definition.existed" class="form-group">
          <label :for="index" class="form-label">{{ definition.label }}</label>
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
          :disabled="isCreating"
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          type="submit"
          :disabled="isCreating"
        >
          <span v-if="isCreating" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ isCreating ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>
  </form>
</template>
<style scoped></style>
