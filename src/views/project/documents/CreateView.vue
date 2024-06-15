<script setup lang="ts">
import router from '@/router'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { documentSchema } from '@/views/project/documents/schema.js'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()

async function createDocument(event: Event) {
  const formData = new FormData(event.currentTarget)
  const success = await documentsStore.create(projectId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to create media')
    return
  }

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
