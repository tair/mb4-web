<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { folderSchema } from './schema.js'

const route = useRoute()
const projectId = route.params.id
const folderId = route.params.folderId
const folder = computed(() => documentsStore.getFolderById(folderId))

const baseUrl = `${
  import.meta.env.VITE_API_URL
}/projects/${projectId}/documents/folder`
const documentsStore = useDocumentsStore()

async function editFolder(event) {
  const formData = new FormData(event.currentTarget)
  const jsonData = Object.fromEntries(formData)

  const url = `${baseUrl}/${folderId}/edit`
  const response = await axios.post(url, jsonData)
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
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!documentsStore.isLoaded"
    basePath="myprojects"
    itemName="documents"
  >
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
  </ProjectContainerComp>
</template>
<style scoped></style>
