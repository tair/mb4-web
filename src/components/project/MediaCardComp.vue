<script setup>
import { buildMediaUrl } from '@/utils/mediaUtils.js'

const props = defineProps({
  media_file: {
    type: Object,
    required: true,
  },
  full_view: {
    type: Boolean,
    required: true,
  },
  show_copy_right: {
    type: Boolean,
    default: true,
  },
  project_id: {
    type: [Number, String],
    required: false,
  },
})

function truncateNote(note) {
  if (note.length > 120) {
    return note.substring(0, 120) + '...'
  } else {
    return note
  }
}

function expandLength(length) {
  return length + 240
}

// HOVER FUNCTIONALITY - COMMENTED OUT (can be restored if needed)
function showEnlargedImage(event, imgId) {
  const enlargedImage = document.getElementById(imgId)
  enlargedImage.style.display = 'block'

  const viewportWidth = window.innerWidth
  const imageRect = enlargedImage.getBoundingClientRect()
  const imageWidth = imageRect.width

  // Check if the image will be cut off on the right side
  if (event.clientX + imageWidth > viewportWidth) {
    // Position it to the left
    enlargedImage.style.left = 'auto'
    enlargedImage.style.right = '20%'
  } else {
    // Position it to the right as default
    enlargedImage.style.left = '20%'
    enlargedImage.style.right = 'auto'
  }

  enlargedImage.style.top = '50%'
}

function hideEnlargedImage(imgId) {
  document.getElementById(imgId).style.display = 'none'
}
</script>

<template>
  <div :class="[full_view ? 'card media-card shadow image-container' : 'card']">
    <div
      class="d-flex flex-column justify-content-between text-center thumbnail"
    >
      <div class="align-self-center media-image-top mt-2">
        <img
          :src="
            media_file.media.thumbnail?.USE_ICON === '3d' 
              ? '/images/3DImage.png'
              : buildMediaUrl(
                  props.project_id,
                  props.media_file?.media_id,
                  'thumbnail'
                )
          "
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
      <div v-if="full_view" class="text-block text-center p-1">
        <div>
          {{ 'M' + media_file.media_id }}
        </div>
        <div
          v-if="media_file.taxon_name"
          v-html="media_file.taxon_name"
          class="truncate-multiline mt-1"
        ></div>
        <div v-if="media_file.view_name" class="mt-1">
          {{ media_file.view_name }}
        </div>
      </div>
    </div>

    <!-- ENLARGED IMAGE DIV - COMMENTED OUT (can be restored if needed) -->
    <!--
    <div
      class="enlarged-image p-2 text-center"
      :id="media_file.media_id"
      :style="{
        width: expandLength(media_file.media.large.WIDTH) + 'px',
      }"
    >
      <img
        :src="getMediaUrl('large')"
        :style="{
          width: media_file.media.large.WIDTH + 'px',
          height: media_file.media.large.HEIGHT + 'px',
          backgroundSize: '20px',
          backgroundRepeat: 'no-repeat',
          backgroundImage: 'url(' + '/images/loader.png' + ')',
          backgroundPosition: '10px 10px',
        }"
        alt="Enlarged Image"
      />
      <div class="text-block text-center p-1">
        <div v-if="media_file.view_name" class="mt-1">
          {{ media_file.view_name }}
        </div>
        <div
          v-if="media_file.specimen_name"
          v-html="media_file.specimen_name"
          class="mt-1"
        ></div>
        <div v-if="show_copy_right && media_file.copyright_holder">
          Copyright Holder: {{ media_file.copyright_holder }}
        </div>
        <div
          v-if="
            show_copy_right && media_file.license && media_file.license.image
          "
        >
          <img :src="`/images/${media_file.license.image}`" class="cc-icon" />
        </div>
        <div
          v-if="show_copy_right && media_file.notes"
          class="truncate-multiline"
          v-html="truncateNote(media_file.notes)"
        ></div>
      </div>
    </div>
    -->
  </div>
</template>

<style>
.media-card {
  width: 12rem;
  height: 15rem;
  font-size: 12px;
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
}
/* ENLARGED IMAGE STYLES - COMMENTED OUT (can be restored if needed) */
/*

.enlarged-image {
  display: none;
  position: absolute;
  top: 50%;
  z-index: 10;
  border: 2px solid orange;
  background-color: white;
  max-width: 600px;
}
*/
.cc-icon {
  width: 88;
  height: 31;
}
</style>
