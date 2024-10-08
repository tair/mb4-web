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

const route = useRoute()

const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const viewStatsTooltipText = getViewStatsTooltipText()
const downloadTooltipText = getDownloadTooltipText()
const copyRightTooltipText = getCopyRightTooltipText()
const cc0Img = getCC0ImgTag()

// TODO: ReCaptcha verification
function onDownloadDocuments(documentUrl) {
  window.open(documentUrl, '_blank')
}

onMounted(() => {
  projectStore.fetchProject(projectId)
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
                  @click="onDownloadDocuments(doc.url)"
                  href="#"
                >
                  >> View/Download File
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
            <a class="ms-auto" @click="onDownloadDocuments(doc.url)" href="#">
              >> View/Download File
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
