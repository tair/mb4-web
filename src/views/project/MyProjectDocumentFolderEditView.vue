<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id
const folderId = route.params.folderId
const folder = ref({})

const baseUrl = `${
  import.meta.env.VITE_API_URL
}/projects/${projectId}/documents/folder`
const documentsStore = useDocumentsStore()

async function editFolder(event) {
  const elements = event.target.elements
  const formData = {}
  if (elements['folder-title'].value != folder.title) {
    formData.title = elements['folder-title'].value
  }
  if (elements['folder-description'].value != folder.title) {
    formData.description = elements['folder-description'].value
  }
  if (elements['folder-access'].value != folder.title) {
    formData.access = elements['folder-access'].value
  }

  const url = `${baseUrl}/${folderId}/edit`
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
  if (folderId) {
    const f = documentsStore.getFolderById(folderId)
    if (f != null) {
      folder.value = { ...f }
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
      <form @submit.prevent="editFolder">
        <div class="row setup-content">
          <div class="form-group">
            <label for="folder-title">Title</label>
            <input
              type="text"
              class="form-control"
              id="folder-title"
              name="title"
              required="required"
              v-model="folder.title"
            />
          </div>
          <div class="form-group">
            <label for="folder-description">Description</label>
            <textarea
              class="form-control"
              id="folder-description"
              name="description"
              v-model="folder.description"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="folder-access">Access</label>
            <select id="folder-access" name="access" class="form-control">
              <option value="0" :selected="folder.access == 0">
                Anyone may edit this item
              </option>
              <option value="1" :selected="folder.access == 1">
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
            <button class="btn btn-primary" type="submit">Edit</button>
          </div>
        </div>
      </form>
    </div>
  </ProjectContainerComp>
</template>
<style scoped></style>
