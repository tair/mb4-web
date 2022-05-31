<script setup>
import { onMounted, ref } from "vue";
import { useMediaStore } from "@/stores/storeMedia.js";
import ProjectLoaderComp from "../../components/project/ProjectLoaderComp.vue";
import MediaCardComp from "../../components/project/MediaCardComp.vue";
import MediaDetailsComp from "../../components/project/MediaDetailsComp.vue";

import { useRoute } from "vue-router";
const route = useRoute();

const mediaStore = useMediaStore();
const project_id = route.params.id;
let mediaDetailsFor = ref(null);

onMounted(() => {
  mediaStore.fetchMediaFiles(project_id);
});

let isDetailsActive = ref(false);

function onShowDetails(media_file) {
  isDetailsActive.value = true;
  mediaDetailsFor.value = media_file;
}
</script>

<template>
  <ProjectLoaderComp
    :project_id="project_id"
    :isLoading="mediaStore.isLoading"
    :errorMessage="mediaStore.media_files ? null : 'No media data available.'"
    itemName="media"
  >
    <p>
      This project has
      {{ mediaStore.media_files?.length }} media files.
    </p>

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
            v-for="(media_file, n) in mediaStore.media_files"
            :key="n"
          >
            <a href="#" @click="onShowDetails(media_file)">
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
