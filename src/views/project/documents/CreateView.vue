<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { documentSchema } from '@/views/project/documents/schema.js'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()

async function createDocument(event) {
  const formData = new FormData(event.currentTarget)

  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/documents/create`

  const response = await axios.post(url, formData)
  if (response.status != 200) {
    alert(response.data?.message || 'Failed to create document')
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
        <button class="btn btn-primary" type="button" @click="$router.go(-1)">
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Create</button>
      </div>
    </div>
  </form>
</template>
<style scoped></style>
