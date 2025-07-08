<script setup>
import { RouterLink } from 'vue-router'
import { buildS3MediaUrl } from '@/utils/util.js'

const props = defineProps({
  project: Object,
})

// Helper function to extract media ID from filename
function extractMediaId(filename) {
  if (!filename) return null
  // Extract media ID from pattern: "media_files_media_911458_preview.jpg"
  const match = filename.match(/media_files_media_(\d+)_preview/)
  return match ? match[1] : null
}

// Helper function to get media URL using S3 endpoint
function getMediaUrl(fileSize = 'medium') {
  if (props.project?.project_id && props.project?.image_props?.media?.FILENAME) {
    const mediaId = extractMediaId(props.project.image_props.media.FILENAME)
    if (mediaId) {
      return buildS3MediaUrl(props.project.project_id, mediaId, fileSize)
    }
  }
  // Fallback to old method if project_id not available
  return null
}
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
            :src="getMediaUrl('large')"
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
      <div class="row">
        <div class="col">
          <RouterLink :to="`/project/${project.project_id}/overview`">
            <button class="btn btn-primary">View Project</button>
          </RouterLink>
        </div>
        <div class="col">
          <div class="theme-color-text">
            <strong>{{ project.project_stats.taxa }}</strong>
          </div>
          <div class="small">Taxa</div>
        </div>
        <div class="col">
          <div class="theme-color-text">
            <strong>{{ project.project_stats.media }}</strong>
          </div>
          <div class="small">Media</div>
        </div>
      </div>
    </div>
  </div>
</template>
