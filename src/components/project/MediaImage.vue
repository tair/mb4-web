<script setup lang="ts">
import { buildS3MediaUrl } from '@/utils/util.js'

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

// Helper function to get media URL using S3 endpoint
function getMediaUrl(): string | null {
  if (props.projectId && props.mediaId) {
    return buildS3MediaUrl(props.projectId, props.mediaId, props.fileSize || 'original')
  }
  // Fallback to existing image URL
  return props.image?.url || null
}
</script>
<template>
  <div
    :style="{
      width: image?.width + 'px',
      height: image?.height + 'px',
    }"
  >
    <img
      v-if="getMediaUrl()"
      :src="getMediaUrl()"
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
