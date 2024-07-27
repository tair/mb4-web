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
let mediaDetailsFor = ref(null)

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
      {{ mediaStore.media_files.length }} media files.
    </p>

    <div class="d-flex justify-content-end">
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
        <div class="row align-items-stretch g-4 py-5">
          <div
            class="col d-flex align-items-stretch"
            v-for="(media_file, n) in mediaStore.mediaList"
            :key="n"
          >
            <a href="#" @click="onShowDetails(media_file)" class="nav-link">
              <MediaCardComp
                :key="media_file.media_id"
                :media_file="media_file"
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
