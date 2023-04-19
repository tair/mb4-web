<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()

async function createDocument(event) {
  const elements = event.target.elements
  const formData = new FormData()
  formData.set('title', elements['document-title'].value)
  formData.set('description', elements['document-description'].value)
  formData.set('access', elements['document-access'].value)
  formData.set('published', elements['document-published'].value)

  const folderId = parseInt(elements['document-folder'].value)
  if (folderId) {
    formData.set('folder_id', folderId)
  }

  if (elements['document-file'].files.length > 0) {
    formData.set('file', elements['document-file'].files[0])
  }

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
  <ProjectContainerComp
    :projectId="projectId"
    basePath="myprojects"
    itemName="documents"
  >
    <div>
      <form @submit.prevent="createDocument">
        <div class="row setup-content">
          <div class="form-group">
            <label for="document-title">Title</label>
            <input
              type="text"
              class="form-control"
              id="document-title"
              name="title"
              required="required"
            />
          </div>
          <div class="form-group">
            <label for="document-description">Description</label>
            <textarea
              class="form-control"
              id="document-description"
              name="description"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="document-file"> Document file to upload </label>
            <input
              type="file"
              id="document-file"
              name="file"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="document-folder">Folder</label>
            <select id="document-folder" name="folder" class="form-control">
              <option value="0">NONE</option>
              <option
                v-for="folder in documentsStore.folders"
                :key="folder.folder_id"
                :value="folder.folder_id"
              >
                {{ folder.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="document-published">Publishing Status</label>
            <select
              id="document-published"
              name="published"
              class="form-control"
            >
              <option value="0">Publish when project is published</option>
              <option value="1">Never publish to project</option>
            </select>
          </div>
          <div class="form-group">
            <label for="document-access">Access</label>
            <select id="document-access" name="access" class="form-control">
              <option value="0">Anyone may edit this item</option>
              <option value="1" selected="selected">
                Only the owner may edit this item
              </option>
            </select>
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
