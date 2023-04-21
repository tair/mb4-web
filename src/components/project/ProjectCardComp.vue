<script setup>
import { RouterLink } from 'vue-router'
import { onUpdated, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  project: Object,
})

function buildImageProps(mediaObj, type) {
  try {
    let media = mediaObj
    if (type) media = mediaObj[type]

    if (!media.HASH || !media.MAGIC || !media.FILENAME) return null

    const url =
      `https://morphobank.org/media/morphobank3/` +
      `images/${media.HASH}/${media.MAGIC}_${media.FILENAME}`

    return url
  } catch (e) {
    console.error(e)
    return null
  }
}
</script>
<style scoped>
.thumb {
  float: left;
  margin: 10px;
  width: 100px;
  height: 140px;
  overflow: hidden;
  backgroundsize: '25px';
  backgroundrepeat: 'no-repeat';
  backgroundimage: 'url(/images/loader.png)';
  backgroundposition: '10px 10px';
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
            :src="buildImageProps(project.image_props)"
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
            <i class="bi bi-grid-fill"></i>
            <small class="text-nowrap ms-1">
              {{ project.project_stats.matrices }} matrices
            </small>
            <Icon
              v-if="project.has_continuous_char"
              icon="radix-icons:ruler-horizontal"
            />
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
            <i class="bi bi-files"></i>
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
            <i class="bi bi-camera"></i>
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
            <i class="bi bi-box"></i>
            <small class="text-nowrap ms-1"
              >{{ project.project_stats.media_3d }} 3D media</small
            >
          </RouterLink>
        </div>
      </div>
      <div class="theme-color-text" v-if="project.has_continuous_char">
        <Icon icon="radix-icons:ruler-horizontal" />
        <small class="text-nowrap ms-1">
          Matrix has continuous characters
        </small>
      </div>
    </div>
  </div>
</template>
