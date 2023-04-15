<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()

async function createFolder(event) {
  const elements = event.target.elements
  const formData = {
    title: elements['folder-title'].value,
    description: elements['folder-description'].value,
    access: elements['folder-access'].value,
  }

  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/documents/folder/create`
  const response = await axios.post(url, formData)
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
          <div class="form-group">
            <label for="folder-title">Title</label>
            <input
              type="text"
              class="form-control"
              id="folder-title"
              name="title"
              required="required"
            />
          </div>
          <div class="form-group">
            <label for="folder-description">Description</label>
            <textarea
              class="form-control"
              id="folder-description"
              name="description"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="folder-access">Access</label>
            <select id="folder-access" name="access" class="form-control">
              <option value="0">Anyone may edit this item</option>
              <option value="1" selected="selected">
                Only the owner may edit this item
              </option>
            </select>
          </div>
          <div class="btn-step-group">
            <button
              class="btn btn-primary btn-step-prev"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary btn-step-next" type="submit">
              Create
            </button>
          </div>
        </div>
      </form>
    </div>
  </ProjectContainerComp>
</template>
<style scoped></style>
