<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useNotifications } from '@/composables/useNotifications'
import { folderSchema } from '@/views/project/documents/schema.js'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()
const { showError, showSuccess } = useNotifications()
const isCreating = ref(false)

async function createFolder(event) {
  if (isCreating.value) return // Prevent double submission
  
  isCreating.value = true
  
  try {
    const formData = new FormData(event.currentTarget)
    const jsonData = Object.fromEntries(formData)

    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/documents/folder/create`
    const response = await axios.post(url, jsonData)
    
    if (response.status != 200) {
      showError(response.data?.message || 'Failed to create folder')
      return
    }

    showSuccess('Folder created successfully!')
    documentsStore.invalidate()
    router.push({ path: `/myprojects/${projectId}/documents` })
  } catch (error) {
    console.error('Error creating folder:', error)
    showError('Failed to create folder. Please try again.')
  } finally {
    isCreating.value = false
  }
}

onMounted(() => {
  if (!documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId)
  }
})
</script>
<template>
  <form @submit.prevent="createFolder">
    <div class="row setup-content">
      <div
        v-for="(definition, index) in folderSchema"
        :key="index"
        class="form-group"
      >
        <label :for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          v-bind="definition.args"
        >
        </component>
      </div>
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
          <span v-if="isCreating">
            <i class="fa fa-spinner fa-spin me-2"></i>
            Creating...
          </span>
          <span v-else>Create</span>
        </button>
      </div>
    </div>
  </form>
</template>
<style scoped></style>
