<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { setCopyRight } from '@/lib/copyright.js'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import ProjectDocumentList from '@/components/project/ProjectDocumentList.vue'
import DeleteDocumentDialog from './DeleteDocumentDialog.vue'
import DeleteFolderDialog from './DeleteFolderDialog.vue'

const route = useRoute()
const projectId = route.params.id

const documentsStore = useDocumentsStore()

const publish_cc0 = ref()
const documentToDelete = ref({})
const folderToDelete = ref({})

onMounted(() => {
  if (!documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="documentsStore.isLoaded">
    <header>
      There are {{ documentsStore.documents?.length }} documents and
      {{ documentsStore.folders?.length }} document folders associated with this
      project.
    </header>
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/documents/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Create Document</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/documents/folders/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa-solid fa-plus"></i>
          <span> Create Folder</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa-solid fa-gear"></i>
        </button>
        <div class="dropdown-menu">
          <h6 class="dropdown-header">Settings:</h6>
          <div class="dropdown-divider"></div>
          <button
            type="button"
            class="dropdown-item"
            data-bs-toggle="modal"
            data-bs-target="#copyrightModal"
          >
            Copyright
          </button>
        </div>
      </div>
    </div>
    <div>
      Use the Documents folder to post material associated with your
      publication, including tree files, combined data files or other
      explanatory documents. Media (2D and 3D images) should not be loaded here
      - please add these to the Media tab.
    </div>
    <div :if="documentsStore.folders.length > 0">
      <strong>{{ documentsStore.folders.length }} Document Folders</strong>
      <div class="accordion" id="accordionFolders">
        <div
          class="accordion-item"
          v-for="folder in documentsStore.folders"
          :key="folder.folder_id"
        >
          <h2 class="accordion-header">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              :data-bs-target="`#folder-${folder.folder_id}`"
            >
              <i class="fa-solid fa-folder"></i>
              <div class="folder-title">
                <span> {{ folder.title }} </span>
                <span class="badge bg-primary rounded-pill">
                  {{
                    documentsStore.getDocumentsForFolder(folder.folder_id)
                      .length
                  }}
                </span>
              </div>
              <div class="list-group-item-buttons folder-buttons">
                <RouterLink
                  :to="`/myprojects/${projectId}/documents/folders/${folder.folder_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#folderDeleteModal"
                  @click="folderToDelete = folder"
                >
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </button>
          </h2>
          <div
            :id="`folder-${folder.folder_id}`"
            class="accordion-collapse collapse"
            data-bs-parent="#accordionFolders"
          >
            <div class="accordion-body">
              <em>{{ folder.description }} </em>
            </div>
            <ProjectDocumentList
              :projectId="projectId"
              :documents="
                documentsStore.getDocumentsForFolder(folder.folder_id)
              "
              v-model:deleteDocument="documentToDelete"
            >
            </ProjectDocumentList>
          </div>
        </div>
      </div>
    </div>
    <div :if="documentsStore.uncategorizedDocuments.length">
      <strong>
        {{ documentsStore.uncategorizedDocuments.length }} Uncategorized
        Documents</strong
      >
      <ProjectDocumentList
        :projectId="projectId"
        :documents="documentsStore.uncategorizedDocuments"
        v-model:deleteDocument="documentToDelete"
      >
      </ProjectDocumentList>
    </div>
    <div class="modal" id="copyrightModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Non-media data copyright preference</h5>
          </div>
          <div class="modal-body">
            The purpose of storing data on MorphoBank is to share those data
            with the scientific community and the public so they may be reused
            for the advancement of research and education. Some researchers
            prefer to go a step further and place a
            <a href="http://creativecommons.org/about/cc0" target="_blank">
              <b>CC0</b>
            </a>
            tag on their data.
            <p>
              <b>NOTE: media copyright is handled separately</b>
            </p>
            <hr />
            <p></p>
            <div class="form-check">
              <input
                v-model="publish_cc0"
                class="form-check-input"
                name="cc0"
                type="checkbox"
                value="1"
                id="publishContentAsCC0"
              />
              <label class="form-check-label" for="publishContentAsCC0">
                Publish project matrix, documents, character list and ontologies
                with CC0 copyright license
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-primary"
              data-bs-dismiss="modal"
              @click="
                () => {
                  setCopyRight(projectId, { publish_cc0: publish_cc0 ? 1 : 0 })
                }
              "
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </LoadingIndicator>
  <DeleteDocumentDialog :document="documentToDelete" :projectId="projectId" />
  <DeleteFolderDialog :folder="folderToDelete" :projectId="projectId" />
</template>
<style scoped>
@import '@/views/project/styles.css';

.folder-title {
  display: flex;
  flex-grow: 1;
}

.folder-title span {
  margin-left: 10px;
}
.folder-buttons {
  display: flex;
  gap: 7px;
  padding-right: 10px;
}
</style>
