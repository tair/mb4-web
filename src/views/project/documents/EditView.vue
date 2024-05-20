<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { documentSchema } from '@/views/project/documents/schema.js'

const route = useRoute()
const projectId = route.params.id
const documentId = route.params.documentId

const baseUrl = `${
  import.meta.env.VITE_API_URL
}/projects/${projectId}/documents`

const documentsStore = useDocumentsStore()
const document = computed(() => documentsStore.getDocumentById(documentId))

async function editDocument(event) {
  const formData = new FormData(event.currentTarget)

  const url = `${baseUrl}/${documentId}/edit`
  const response = await axios.post(url, formData)
  if (response.status != 200) {
    alert(response.data?.message || 'Failed to modify folder')
    return
  }

  documentsStore.invalidate()
  router.push({ path: `/myprojects/${projectId}/documents` })
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
      <form @submit.prevent="editDocument">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in documentSchema"
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
              :value="document[index]"
              v-bind="definition.args"
            >
            </component>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-primary"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>
<style scoped></style>
