<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import {
  getViewStatsTooltipText,
  getDownloadTooltipText,
  getCopyRightTooltipText,
  getCC0ImgTag,
} from '@/utils/util.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import { logDownload, logView, HIT_TYPES, DOWNLOAD_TYPES } from '@/lib/analytics.js'

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const documentId = route.params.documentId
const viewStatsTooltipText = getViewStatsTooltipText()
const downloadTooltipText = getDownloadTooltipText()
const copyRightTooltipText = getCopyRightTooltipText()
const cc0Img = getCC0ImgTag()

// TODO: ReCaptcha verification
async function onDownloadDocuments(documentUrl, filename, docId = null) {
  try {
    // Fetch the document as a blob
    const response = await fetch(documentUrl)

    if (!response.ok)
      throw new Error(`Failed to fetch the document: ${response.statusText}`)

    const blob = await response.blob()
    const contentType = response.headers.get('Content-Type')

    // Check if the content is viewable (images, pdf, text)
    if (
      contentType.startsWith('image/') ||
      contentType.startsWith('application/pdf') ||
      contentType.startsWith('text/')
    ) {
      // Open viewable types in a new tab
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
    } else {
      // For other types, force download
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || documentUrl.split('/').pop() // Fallback to original filename if none provided
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl) // Clean up
    }

    logDownload({ project_id: projectId, download_type: DOWNLOAD_TYPES.DOCUMENT, row_id: docId })
  } catch (error) {
    console.error('Error downloading the file:', error)
    // Fallback to opening the file in a new tab
    window.open(documentUrl, '_blank')
  }
}

onMounted(() => {
  projectStore.fetchProject(projectId)
  // Track documents page view
  logView({ project_id: projectId, hit_type: HIT_TYPES.DOCUMENT })
})

function getDocumentsSectionTitle(docs) {
  let length = docs.documents.length
  let text = length
  if (docs.folders && docs.folders.length > 0) text += ' Uncategorized'
  text += length > 1 ? ' Documents' : ' Document'
  return text
}

function getDocumentsNumbers(docs) {
  let docNum = 0
  if (docs.folders) {
    for (let i = 0; i < docs.folders.length; i++) {
      docNum += docs.folders[i].documents.length
    }
  }
  if (docs.documents) docNum += docs.documents.length
  let text = `This project has ${docNum} document`
  if (docNum > 1) text += 's'
  if (docs.folders && docs.folders.length > 0) {
    text += ` and ${docs.folders.length} folder`
    if (docs.folders.length > 1) text += 's'
  }
  text += '.'
  return text
}
</script>

<template>
  <ProjectLoaderComp
    :isLoading="projectStore.isLoading"
    :errorMessage="projectStore.docs ? null : 'No documents data available.'"
    basePath="project"
  >
    <div class="mb-5">{{ getDocumentsNumbers(projectStore.docs) }}</div>
    <div class="mb-2">
      Please find here additional documents associated with this project.
      Occasionally MorphoBank receives matrices that are not formatted to parse
      to the database, these can also be found here, along with others and are
      presented 'as is' from the scientist.
    </div>
    <div v-if="projectStore.overview?.publish_cc0" class="img-float">
      <Tooltip
        :content="copyRightTooltipText"
        :displayStyle="'image'"
        :displayContent="cc0Img"
      ></Tooltip>
    </div>
    <div
      v-if="projectStore.docs.folders && projectStore.docs.folders.length > 0"
      class="mb-4"
    >
      <h4>
        {{ projectStore.docs.folders.length }} Document
        {{ projectStore.docs.folders.length > 1 ? 'Folders' : 'Folder' }}
      </h4>
      <div :key="n" v-for="(fld, n) in projectStore.docs.folders">
        <div
          data-bs-toggle="collapse"
          :href="`#collapse${n}`"
          role="button"
          class="mb-2"
        >
          <i class="fa-solid fa-folder me-1"></i
          ><strong v-html="fld.title"></strong> ({{ fld.documents.length }}
          {{ fld.documents.length > 1 ? 'documents' : 'document' }})
        </div>
        <div class="collapse ms-3" :id="`collapse${n}`">
          <p v-if="fld.description" v-html="fld.description"></p>
          <ul class="list-group">
            <li
              :key="m"
              v-for="(doc, m) in fld.documents"
              :class="[
                m % 2 != 0 ? 'list-group-item-secondary' : '',
                'list-group-item',
              ]"
            >
              <div class="d-flex align-items-center">
                <span v-html="doc.title"></span>
                <span v-if="doc.download">
                  &nbsp;(Downloaded {{ doc.download }} times
                  <Tooltip :content="viewStatsTooltipText"></Tooltip>)</span
                >
                <a
                  class="ms-auto"
                  @click="onDownloadDocuments(doc.url, doc.file_name, doc.document_id)"
                  href="#"
                >
                  View/Download File
                  <Tooltip :content="downloadTooltipText"></Tooltip>
                </a>
              </div>
              <div v-if="doc.description" class="ms-4">
                {{ doc.description }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div
      v-if="
        projectStore.docs.documents && projectStore.docs.documents.length > 0
      "
    >
      <h4>{{ getDocumentsSectionTitle(projectStore.docs) }}</h4>
      <ul class="list-group">
        <li
          :key="m"
          v-for="(doc, m) in projectStore.docs.documents"
          :class="[
            m % 2 != 0 ? 'list-group-item-secondary' : '',
            'list-group-item',
          ]"
        >
          <div class="d-flex align-items-center">
            <span v-html="doc.title"></span>
            <span v-if="doc.download">
              &nbsp;(Downloaded {{ doc.download }} times
              <Tooltip :content="viewStatsTooltipText"></Tooltip>)</span
            >
            <a
              class="ms-auto"
              @click="onDownloadDocuments(doc.url, doc.file_name, doc.document_id)"
              href="#"
            >
              View/Download File
              <Tooltip :content="downloadTooltipText"></Tooltip>
            </a>
          </div>
          <div v-if="doc.description" class="ms-4">{{ doc.description }}</div>
        </li>
      </ul>
    </div>
  </ProjectLoaderComp>
</template>

<style>
.img-float {
  float: right;
  margin-right: 10px;
}
</style>
