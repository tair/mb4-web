<script setup>
import { RouterLink } from 'vue-router'

const props = defineProps({
  media_file: {
    type: Object,
    required: true,
  },
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
  <div class="card shadow">
    <div class="m-1">
      <img
        :src="buildImageProps(media_file.media.thumbnail)"
        :style="{
          width: media_file.media.thumbnail.WIDTH + 'px',
          height: media_file.media.thumbnail.HEIGHT + 'px',
          backgroundSize: '20px',
          backgroundRepeat: 'no-repeat',
          backgroundImage: 'url(' + '/images/loader.png' + ')',
          backgroundPosition: '10px 10px',
        }"
        class="card-img-top"
      />
    </div>
    <!-- </RouterLink> -->

    <div class="card-body">
      <p class="card-text">
        {{ media_file.notes }}
      </p>
    </div>
  </div>
</template>
