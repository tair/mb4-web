<script setup>

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
  <div class="card media-card shadow image-container">
    <div class="d-flex flex-column justify-content-between text-center thumbnail">
      <div class="align-self-center media-image-top mt-2">
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
      />
      </div>
      <div class="text-block text-center p-1">
        <div>
          {{ 'M' + media_file.media_id }}
        </div>
        <div
          v-if="media_file.specimen_name"
          v-html="media_file.specimen_name"
          class="truncate-multiline mt-1"
        ></div>
        <div
          v-if="media_file.view_name"
          class="mt-1"
        >
          {{ media_file.view_name }}
        </div>
      </div>
    </div>
    <div class="enlarged-image p-2">
      <img
        :src="buildImageProps(media_file.media.medium)"
        :style="{
          width: media_file.media.medium.WIDTH + 'px',
          height: media_file.media.medium.HEIGHT + 'px',
          backgroundSize: '20px',
          backgroundRepeat: 'no-repeat',
          backgroundImage: 'url(' + '/images/loader.png' + ')',
          backgroundPosition: '10px 10px',
        }"
        alt="Enlarged Image"
      />
      <div class="text-block text-center p-1">
        <div
          v-if="media_file.view_name"
          class="mt-1"
        >
          {{ media_file.view_name }}
        </div>
        <div
          v-if="media_file.specimen_name"
          v-html="media_file.specimen_name"
          class="mt-1"
        ></div>
        <div v-if="media_file.copyright_holder">Copyright Holder: {{ media_file.copyright_holder }}</div>
        <div v-if="media_file.notes" class="truncate-multiline">{{ media_file.notes }}</div>
      </div>
    </div>
  </div>
</template>

<style>
.media-card {
  width: 12rem;
  height: 15rem;
}
.media-image-top {
  height: 8rem;
}
.truncate-multiline {
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Number of lines to display before truncating */
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.image-container {
    position: relative;
    display: inline-block;
}
.enlarged-image {
    display: none;
    position: absolute;
    top: 50%;
    left: 20%;
    z-index: 10;
    border: 2px solid orange;
    background-color: white;
    max-width: 500px
}
.thumbnail:hover + .enlarged-image {
    display: block;
}
</style>
