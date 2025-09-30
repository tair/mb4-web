<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useNotifications } from '@/composables/useNotifications'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { folderSchema } from '@/views/project/documents/schema.js'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectId = route.params.id
const folderId = parseInt(route.params.folderId)
const folder = computed(() => documentsStore.getFolderById(folderId))

const baseUrl = apiService.buildUrl(`/projects/${projectId}/documents/folder`)
const documentsStore = useDocumentsStore()
const { showError, showSuccess } = useNotifications()
const isSaving = ref(false)

async function editFolder(event) {
  if (isSaving.value) return // Prevent double submission
  
  isSaving.value = true
  
  try {
    const formData = new FormData(event.currentTarget)
    const jsonData = Object.fromEntries(formData)

    const url = `${baseUrl}/${folderId}/edit`
    const response = await apiService.post(url, jsonData)
    
    if (!response.ok) {
      const errorData = await response.json()
      showError(errorData?.message || 'Failed to modify folder')
      return
    }

    showSuccess('Folder updated successfully!')
    documentsStore.invalidate()
    router.push({ path: `/myprojects/${projectId}/documents` })
  } catch (error) {
    console.error('Error updating folder:', error)
    showError('Failed to update folder. Please try again.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  if (!documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="documentsStore.isLoaded">
    <div>
      <form @submit.prevent="editFolder">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in folderSchema"
            :key="index"
            class="form-group"
          >
            <label :for="index" class="form-label">{{
              definition.label
            }}</label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              :value="folder[index]"
              v-bind="definition.args"
            >
            </component>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-outline-primary"
              type="button"
              @click="$router.go(-1)"
              :disabled="isSaving"
            >
              Cancel
            </button>
            <button 
              class="btn btn-primary" 
              type="submit"
              :disabled="isSaving"
            >
              <span v-if="isSaving">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Saving...
              </span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>
<style scoped></style>
