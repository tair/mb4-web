<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { toDateString } from '@/utils/date'

const route = useRoute()
const projectId = route.params.id
const documentId = route.params.documentId
const document = ref({})

const baseUrl = `${
  import.meta.env.VITE_API_URL
}/projects/${projectId}/documents`
const documentsStore = useDocumentsStore()

async function editDocument(event) {
  const elements = event.target.elements
  const formData = new FormData()

  const folderId = parseInt(elements['document-folder'].value)
  if (document.value.folder_id != folderId) {
    formData.set('folder_id', folderId)
  }

  if (elements['document-file'].files.length > 0) {
    formData.set('file', elements['document-file'].files[0])
  }

  if (elements['document-title'].value != document.title) {
    formData.set('title', elements['document-title'].value)
  }
  if (elements['document-description'].value != document.description) {
    formData.set('description', elements['document-description'].value)
  }
  if (elements['document-access'].value != document.access) {
    formData.set('access', elements['document-access'].value)
  }
  if (elements['document-published'].value != document.published) {
    formData.set('published', elements['document-published'].value)
  }

  const url = `${baseUrl}/${documentId}/edit`
  const response = await axios.post(url, formData)
  if (response.status != 200) {
    alert(response.data?.message || 'Failed to modify folder')
    return
  }

  documentsStore.invalidate()
  router.push({ path: `/myprojects/${projectId}/documents` })
}

onMounted(async () => {
  if (!documentsStore.isLoaded) {
    await documentsStore.fetchDocuments(projectId)
  }
  if (documentId) {
    const d = documentsStore.getDocumentById(documentId)
    if (d != null) {
      document.value = { ...d }
    }
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
      <form @submit.prevent="editDocument">
        <div class="row setup-content">
          <div class="form-group">
            <label for="document-title">Title</label>
            <input
              type="text"
              class="form-control"
              id="document-title"
              name="title"
              required="required"
              v-model="document.title"
            />
          </div>
          <div class="form-group">
            <label for="document-description">Description</label>
            <textarea
              class="form-control"
              id="document-description"
              name="description"
              v-model="document.description"
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
                :selected="folder.folder_id == document.folder_id"
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
              <option value="0" :selected="document.published == 0">
                Publish when project is published
              </option>
              <option value="1" :selected="document.published == 1">
                Never publish to project
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="document-access">Access</label>
            <select id="document-access" name="access" class="form-control">
              <option value="0" :selected="document.access == 0">
                Anyone may edit this item
              </option>
              <option value="1" :selected="document.access == 1">
                Only the owner may edit this item
              </option>
            </select>
          </div>
          <div class="form-group">
            <div>Uploaded on</div>
            <div>{{ toDateString(document.uploaded_on) }}</div>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-primary"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Edit</button>
          </div>
        </div>
      </form>
    </div>
  </ProjectContainerComp>
</template>
<style scoped></style>
