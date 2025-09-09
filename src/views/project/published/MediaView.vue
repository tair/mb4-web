<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import MediaCardComp from '@/components/project/MediaCardComp.vue'

const route = useRoute()

const mediaStore = usePublicMediaStore()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const mediaId = route.params.mediaId
const thumbnailView = ref(true)
const orderByOptions = mediaStore.getOrderByOptions
let orderBySelection = ref(mediaStore.getDefaultOrderBy)
let searchStr = ref(null)

onMounted(async () => {
  await mediaStore.fetchMediaFiles(projectId)
  // need to get project title
  await projectStore.fetchProject(projectId)
})

let selectedPage = ref(mediaStore.currentPage)
let selectedPageSize = ref(mediaStore.itemsPerPage)

function searchByStr() {
  mediaStore.filterMediaFiles(searchStr.value)
  mediaStore.recalculatePageInfo()
  mediaStore.fetchByPage()
}

function onResetSearch() {
  searchStr.value = ''
  searchByStr()
}

watch(orderBySelection, (currentValue, oldValue) => {
  mediaStore.sortByOption(currentValue)
  mediaStore.fetchByPage()
})

watch(selectedPage, (currentValue, oldValue) => {
  mediaStore.currentPage = currentValue
  mediaStore.fetchByPage()
})

watch(selectedPageSize, (currentValue, oldValue) => {
  mediaStore.itemsPerPage = currentValue
  mediaStore.currentPage = 1
  mediaStore.recalculatePageInfo()
  mediaStore.fetchByPage()
})
</script>

<template>
  <ProjectLoaderComp
    :isLoading="mediaStore.isLoading"
    :errorMessage="mediaStore.media_files ? null : 'No media data available.'"
    basePath="project"
  >
    <p>
      This project has
      {{ mediaStore.full_media_files.length }} media files. Displaying
      {{ mediaStore.media_files.length }} media files.
    </p>

    <div class="row mb-3">
      <div class="col-5">
        <div class="mb-2">
          <label for="filter" class="me-2">Search for:</label>
          <input id="filter" v-model="searchStr" class="me-2" />
          <button @click="searchByStr()" class="btn btn-primary me-2">
            Submit
          </button>
          <button @click="onResetSearch()" class="btn btn-primary btn-white">
            Clear
          </button>
        </div>
        <div>
          <label for="order-by" class="me-2">Order by:</label>
          <select id="order-by" v-model="orderBySelection">
            <option
              v-for="(label, value) in orderByOptions"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
        </div>
      </div>
      <div class="d-flex col-7 justify-content-end">
        <div class="me-5">
          Showing page
          <select v-model="selectedPage">
            <option
              :selected="idx == 1"
              v-for="(idx, type) in mediaStore.totalPages"
              :value="idx"
            >
              {{ idx }}
            </option>
          </select>
          of {{ mediaStore.totalPages }} pages.
        </div>

        <div>
          Items per page:
          <select v-model="selectedPageSize">
            <option
              :selected="idx == 10"
              v-for="(idx, type) in [3, 5, 10, 25, 50, 100]"
              :value="idx"
            >
              {{ idx }}
            </option>
          </select>
        </div>
        <div class="ms-1">
          <button
            @click="thumbnailView = true"
            :style="{ backgroundColor: thumbnailView ? '#e0e0e0' : '#fff' }"
            title="thumbnail-view"
          >
            <i class="fa-solid fa-border-all"></i>
          </button>
        </div>
        <div class="ms-1">
          <button
            @click="thumbnailView = false"
            :style="{ backgroundColor: thumbnailView ? '#fff' : '#e0e0e0' }"
            title="mosaic-view"
          >
            <i class="fa-solid fa-table-cells"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Media List Content -->
        <div
          :class="[
            thumbnailView
              ? 'row row-cols-auto g-4 py-5'
              : 'row row-cols-auto g-2 py-3',
            'justify-content-start',
          ]"
        >
          <div
            class="col d-flex align-items-stretch"
            v-for="(media_file, n) in mediaStore.mediaList"
            :key="n"
          >
            <router-link 
              :to="{ name: 'ProjectMediaDetailView', params: { id: projectId, mediaId: media_file.media_id } }" 
              class="nav-link"
            >
              <MediaCardComp
                :key="media_file.media_id"
                :media_file="media_file"
                :full_view="thumbnailView"
                :project_id="projectId"
              ></MediaCardComp>
            </router-link>
          </div>
        </div>
  </ProjectLoaderComp>
</template>
