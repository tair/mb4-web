<script setup>
import { RouterLink } from 'vue-router'
import { onUpdated, onMounted } from 'vue'

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

<template>
  <div class="card shadow" style="width: 18rem">
    <RouterLink :to="`/project/${project.project_id}/overview`">
      <div class="border-bottom" style="height: 145px">
        <img
          :src="buildImageProps(project.image_props)"
          :style="{
            width: project.image_props.WIDTH + 'px',
            height: project.image_props.HEIGHT + 'px',
            backgroundSize: '25px',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(' + '/images/loader.png' + ')',
            backgroundPosition: '10px 10px',
          }"
          class="card-img-top"
        />
      </div>
    </RouterLink>

    <div class="card-body">
      <strong>
        Project {{ project.project_id }}:
        {{ project.article_authors }}
      </strong>
      <p class="card-text">
        {{ project.article_title }}
      </p>
    </div>
    <div class="card-footer">
      <div class="row align-items-stretch">
        <div class="col d-flex align-items-stretch">
          <RouterLink
            :to="`/project/${project.project_id}/docs`"
            class="nav-link p-0"
          >
            <i class="bi bi-files"></i>
            <small class="text-nowrap ms-1">
              {{ project.project_stats.docs }} documents
            </small>
          </RouterLink>
        </div>
        <div class="col d-flex align-items-stretch">
          <RouterLink
            :to="`/project/${project.project_id}/media`"
            class="nav-link p-0"
          >
            <i class="bi bi-camera"></i>
            <small class="text-nowrap ms-1"
              >{{ project.project_stats.media }} media</small
            >
          </RouterLink>
        </div>
        <div class="col d-flex align-items-stretch">
          <RouterLink
            :to="`/project/${project.project_id}/matrices`"
            class="nav-link p-0"
          >
            <i class="bi bi-badge-3d"></i>
            <small class="text-nowrap ms-1">
              {{ project.project_stats.matrices }} matrices
            </small>
          </RouterLink>
        </div>
        <div class="col d-flex align-items-stretch">
          <RouterLink
            :to="`/project/${project.project_id}/overview`"
            class="nav-link p-0"
          >
            <i class="bi bi-house"></i>
            <small class="text-nowrap ms-1">Home</small>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
