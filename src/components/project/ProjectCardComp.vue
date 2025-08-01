<script setup>
import { RouterLink } from 'vue-router'
import { buildMediaUrl } from '@/utils/fileUtils.js'
import { computed } from 'vue'

const props = defineProps({
  project: Object,
})

// Extract media ID from filename
const mediaId = computed(() => {
  const match = props.project.image_props.media.FILENAME.match(
    /media_files_media_(\d+)_preview/
  )
  return match ? match[1] : null
})
</script>
<style scoped>
.thumb {
  float: left;
  margin: 10px;
  width: 100px;
  height: 140px;
  overflow: hidden;
  background-size: '25px';
  background-repeat: 'no-repeat';
  background-image: 'url(/images/loader.png)';
  background-position: '10px 10px';
}
.thumb-row {
  height: 160px;
}
.card {
  width: 18rem;
}
.in-press {
  background-color: #3362b4;
  padding-top: 50px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  height: 140px;
  line-height: 1.3em;
}
.card-footer {
  height: 90px;
}
.theme-color-text {
  color: #ef782f !important;
}
</style>

<template>
  <div class="card shadow">
    <RouterLink :to="`/project/${project.project_id}/overview`">
      <div class="border-bottom row thumb-row">
        <div class="col align-items-stretch thumb">
          <img
            v-if="project.journal_cover_url"
            :src="project.journal_cover_url"
            class="card-img-top"
          />
          <div
            v-if="!project.journal_cover_url && project.journal_in_press"
            class="in-press"
          >
            In<br />Press
          </div>
        </div>
        <div class="col d-flex align-items-stretch thumb">
          <img
            :src="buildMediaUrl(props.project.project_id, mediaId, 'large')"
            class="card-img-top"
          />
        </div>
      </div>
    </RouterLink>

    <div class="card-body">
      <RouterLink :to="`/project/${project.project_id}/overview`">
        <strong>
          Project {{ project.project_id }}:
          {{ project.article_authors }}
        </strong>
      </RouterLink>
      <p class="card-text">
        {{ project.article_title }}
      </p>
      <span class="p-0 small m-0 fw-lighter"
        >Journal Year: {{ project.journal_year }}</span
      >
    </div>
    <div class="card-footer">
      <div class="row align-items-stretch">
        <!-- tooltip dosplay order matters for layout -->
        <div
          v-if="project.project_stats.matrices"
          class="col d-flex align-items-stretch"
        >
          <RouterLink
            :to="`/project/${project.project_id}/matrices`"
            class="nav-link p-0"
          >
            <i class="fa-solid fa-border-all"></i>
            <small class="text-nowrap mx-1">
              {{ project.project_stats.matrices }} matrices
            </small>
            <i
              v-if="project.has_continuous_char"
              class="fa-solid fa-ruler-horizontal"
            ></i>
          </RouterLink>
        </div>
        <div
          v-if="project.project_stats.docs"
          class="col d-flex align-items-stretch"
        >
          <RouterLink
            :to="`/project/${project.project_id}/docs`"
            class="nav-link p-0"
          >
            <i class="fa-solid fa-file"></i>
            <small class="text-nowrap ms-1">
              {{ project.project_stats.docs }}
              {{ project.project_stats.docs > 99 ? 'document' : 'documents' }}
            </small>
          </RouterLink>
        </div>
        <div
          v-if="project.project_stats.media_image"
          class="col d-flex align-items-stretch"
        >
          <RouterLink
            :to="`/project/${project.project_id}/media`"
            class="nav-link p-0"
          >
            <i class="fa-solid fa-camera"></i>
            <small class="text-nowrap ms-1"
              >{{ project.project_stats.media_image }} images</small
            >
          </RouterLink>
        </div>
        <div
          v-if="project.project_stats.media_3d"
          class="col d-flex align-items-stretch"
        >
          <RouterLink
            :to="`/project/${project.project_id}/media`"
            class="nav-link p-0"
          >
            <i class="fa-solid fa-cube"></i>
            <small class="text-nowrap ms-1"
              >{{ project.project_stats.media_3d }} 3D media</small
            >
          </RouterLink>
        </div>
        <div
          v-if="project.has_continuous_char"
          class="col d-flex align-items-stretch theme-color-text"
        >
          <i class="fa-solid fa-ruler-horizontal"></i>
          <small class="text-nowrap ms-1">
            Matrix has continuous characters
          </small>
        </div>
      </div>
    </div>
  </div>
</template>
