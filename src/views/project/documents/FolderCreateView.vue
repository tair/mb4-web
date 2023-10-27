<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { folderSchema } from './schema.js'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()

async function createFolder(event) {
  const formData = new FormData(event.currentTarget)
  const jsonData = Object.fromEntries(formData)

  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/documents/folder/create`
  const response = await axios.post(url, jsonData)
  if (response.status != 200) {
    alert(response.data?.message || 'Failed to create folder')
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
    basePath="myprojects"
    itemName="documents"
  >
    <div>
      <form @submit.prevent="createFolder">
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
            <button class="btn btn-primary" type="submit">Create</button>
          </div>
        </div>
      </form>
    </div>
  </ProjectContainerComp>
</template>
<style scoped></style>
