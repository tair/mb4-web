<script setup>
import { RouterLink } from 'vue-router'
import { buildMediaUrl } from '@/utils/fileUtils.js'
import { apiService } from '@/services/apiService.js'
import { computed } from 'vue'

const props = defineProps({
  project: Object,
})

// Check if this is a 3D media file using USE_ICON
const is3DFile = computed(() => {
  return props.project?.image_props?.media?.USE_ICON === '3d'
})

// Build journal cover URL from path
const journalCoverUrl = computed(() => {
  if (!props.project?.journal_cover_path) {
    return null
  }
  return apiService.buildUrl(props.project.journal_cover_path)
})

// Get the appropriate media URL (3D icon for 3D media, image URL for others)
const mediaUrl = computed(() => {
  const imageProps = props.project?.image_props
  
  // Check if this is a 3D file that should use the 3D icon
  if (is3DFile.value) {
    return '/images/3DImage.png'
  }

  // First approach: Use S3_KEY directly if available (current format)
  const s3Key = imageProps?.media?.S3_KEY
  if (s3Key) {
    // Replace thumbnail with large for better display quality
    // S3_KEY format: media_files/images/{project_id}/{media_id}/{project_id}_{media_id}_{variant}.jpg
    const largeS3Key = s3Key.replace(/_thumbnail\./, '_large.')
    return apiService.buildUrl(`/s3/${largeS3Key}`)
  }
  
  // Second approach: Extract media_id from FILENAME (legacy format)
  const filename = imageProps?.media?.FILENAME
  if (filename) {
    // Match both _preview and _thumbnail formats
    const match = filename.match(/media_files_media_(\d+)_(?:preview|thumbnail)/)
    if (match) {
      const mediaId = match[1]
      return buildMediaUrl(props.project.project_id, mediaId, 'large')
    }
  }
  
  // Third approach: Use media_id directly if provided (future format after backend update)
  if (imageProps?.media_id) {
    return buildMediaUrl(props.project.project_id, imageProps.media_id, 'large')
  }

  return null
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
.stat-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  flex: 1;
  margin-bottom: 4px;
}
.stat-item i {
  flex-shrink: 0;
  margin-right: 4px;
}
.stat-item small {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
}
</style>

<template>
  <div class="card shadow">
    <RouterLink :to="`/project/${project.project_id}/overview`">
      <div class="border-bottom row thumb-row">
        <div class="col align-items-stretch thumb">
          <img
            v-if="journalCoverUrl"
            :src="journalCoverUrl"
            class="card-img-top"
          />
          <div
            v-if="!journalCoverUrl && project.journal_in_press"
            class="in-press"
          >
            In<br />Press
          </div>
        </div>
        <div class="col d-flex align-items-stretch thumb">
          <img
            v-if="mediaUrl"
            :src="mediaUrl"
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
        {{ project.article_title || project.name }}
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
          class="col"
        >
          <RouterLink
            :to="`/project/${project.project_id}/matrices`"
            class="nav-link p-0 stat-item"
          >
            <i class="fa-solid fa-border-all"></i>
            <small>
              {{ project.project_stats.matrices }}&nbsp;{{ project.project_stats.matrices > 1 ? 'matrices' : 'matrix' }}
            </small>
            <i
              v-if="project.has_continuous_char"
              class="fa-solid fa-ruler-horizontal ms-1"
            ></i>
          </RouterLink>
        </div>
        <div
          v-if="project.project_stats.docs"
          class="col"
        >
          <RouterLink
            :to="`/project/${project.project_id}/docs`"
            class="nav-link p-0 stat-item"
          >
            <i class="fa-solid fa-file"></i>
            <small>
              {{ project.project_stats.docs }}&nbsp;{{ project.project_stats.docs > 1 ? 'documents' : 'document' }}
            </small>
          </RouterLink>
        </div>
        <div
          v-if="project.project_stats.media_image"
          class="col"
        >
          <RouterLink
            :to="`/project/${project.project_id}/media`"
            class="nav-link p-0 stat-item"
          >
            <i class="fa-solid fa-camera"></i>
            <small>
              {{ project.project_stats.media_image }}&nbsp;{{ project.project_stats.media_image > 1 ? 'images' : 'image' }}
            </small>
          </RouterLink>
        </div>
        <div
          v-if="project.project_stats.media_3d"
          class="col"
        >
          <RouterLink
            :to="`/project/${project.project_id}/media`"
            class="nav-link p-0 stat-item"
          >
            <i class="fa-solid fa-cube"></i>
            <small>
              {{ project.project_stats.media_3d }} 3D media
            </small>
          </RouterLink>
        </div>
        <div
          v-if="project.has_continuous_char"
          class="col theme-color-text"
        >
          <div class="stat-item">
            <i class="fa-solid fa-ruler-horizontal"></i>
            <small>
              Matrix has continuous characters
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
