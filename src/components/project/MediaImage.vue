<script setup lang="ts">
import { buildMediaUrl } from '@/utils/fileUtils.js'

interface Image {
  url: string
  width: string | number
  height: string | number
}

const props = defineProps<{
  image?: Image
  projectId?: number | string
  mediaId?: number | string
  fileSize?: string
}>()
</script>
<template>
  <div
    :style="{
      width: image?.width + 'px',
      height: image?.height + 'px',
    }"
  >
    <img
      :src="
        buildMediaUrl(
          props.projectId,
          props.mediaId,
          props.fileSize || 'original'
        )
      "
      :width="image?.width"
      :height="image?.height"
      class="loading"
    />
  </div>
</template>
<style scoped>
.loading {
  background-size: 20px;
  background-repeat: no-repeat;
  background-image: url('/images/loader.png');
  background-position: 10px 10px;
}
</style>
