<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import MediaCardComp from '@/components/project/MediaCardComp.vue'
import MediaDetailsComp from '@/components/project/MediaDetailsComp.vue'

const route = useRoute()

const mediaStore = usePublicMediaStore()
const projectId = route.params.id
const thumbnailView = ref(true)
const mediaDetailsFor = ref(null)
const orderByOptions = mediaStore.getOrderByOptions
let orderBySelection = ref(mediaStore.getDefaultOrderBy)
let searchStr = ref(null)

onMounted(() => {
  mediaStore.fetchMediaFiles(projectId)
})

let isDetailsActive = ref(false)
let selectedPage = ref(mediaStore.currentPage)
let selectedPageSize = ref(mediaStore.itemsPerPage)

function onShowDetails(media_file) {
  isDetailsActive.value = true
  mediaDetailsFor.value = media_file
}

watch(orderBySelection, (currentValue, oldValue) => {
  mediaStore.sortByOption(currentValue)
  mediaStore.fetchByPage()
})

watch(searchStr, (currentValue, oldValue) => {
  mediaStore.filterMediaFiles(currentValue)
  mediaStore.recalculatePageInfo()
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
          <input id="filter" v-model="searchStr" class="me-2"/>
          <button @click="searchStr=''" class="btn btn-primary btn-white">clear</button>
        </div>
        <div>
          <label for="order-by" class="me-2">Order by:</label>
          <select id="order-by" v-model="orderBySelection">
            <option v-for="(label, value) in orderByOptions" :key="value" :value="value">
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
            :style="{ backgroundColor: thumbnailView ? '#e0e0e0' : '#fff'}"
            title="thumbnail-view">
            <i class="fa-solid fa-border-all"></i>
          </button>
        </div>
        <div class="ms-1">
          <button
            @click="thumbnailView = false"
            :style="{ backgroundColor: thumbnailView ? '#fff' : '#e0e0e0'}"
            title="mosaic-view">
            <i class="fa-solid fa-table-cells"></i>
          </button>
        </div>
      </div>
    </div>

    <nav>
      <div class="nav nav-tabs" id="nav-tab" role="tablist">
        <a
          @click="isDetailsActive = false"
          :class="[{ active: isDetailsActive == false }, 'nav-link']"
          id="nav-media-list-tab"
          data-bs-toggle="tab"
          href="#nav-media-list"
          role="tab"
          aria-controls="nav-media-list"
          aria-selected="true"
          >Media list</a
        >
        <a
          @click="isDetailsActive = true"
          :class="[{ active: isDetailsActive == true }, 'nav-link']"
          id="nav-media-details-tab"
          data-bs-toggle="tab"
          href="#nav-media-details"
          role="tab"
          aria-controls="nav-media-details"
          aria-selected="false"
          >Media details</a
        >
      </div>
    </nav>
    <div class="tab-content" id="nav-tabContent">
      <div
        :class="[
          { active: !isDetailsActive },
          { show: !isDetailsActive },
          'tab-pane',
          'fade',
        ]"
        id="nav-media-list"
        role="tabpanel"
        aria-labelledby="nav-media-list-tab"
      >
        <div :class="[thumbnailView ? 'row row-cols-auto g-4 py-5' : 'row row-cols-auto g-2 py-3', 'justify-content-start']">
          <div
            class="col d-flex align-items-stretch"
            v-for="(media_file, n) in mediaStore.mediaList"
            :key="n"
          >
            <a href="#" @click="onShowDetails(media_file)" class="nav-link">
              <MediaCardComp
                :key="media_file.media_id"
                :media_file="media_file"
                :full_view=thumbnailView
              ></MediaCardComp>
            </a>
          </div>
        </div>
      </div>
      <div
        :class="[
          { active: isDetailsActive },
          { show: isDetailsActive },
          'tab-pane',
          'fade',
        ]"
        id="nav-media-details"
        role="tabpanel"
        aria-labelledby="nav-media-details-tab"
      >
        <!-- For: {{ mediaDetailsFor }} -->
        <MediaDetailsComp :media_file="mediaDetailsFor"></MediaDetailsComp>
      </div>
    </div>
  </ProjectLoaderComp>
</template>