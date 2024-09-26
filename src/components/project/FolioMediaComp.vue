<script setup>
import { ref } from 'vue'
import MediaCardComp from './MediaCardComp.vue'
import CustomModal from './CustomModal.vue'
import MediaViewPanel from './MediaViewPanel.vue'
import { buildImageProps } from '@/utils/util.js'

const props = defineProps({
  media_file: {
    type: Object,
    required: true,
  },
})

const showZoomModal = ref(false)
</script>
<template>
  <a href="#" class="nav-link" @click="showZoomModal = true">
    <MediaCardComp
      :key="media_file.media_id"
      :media_file="media_file"
      :full_view="true"
      :show_copy_right="false"
    ></MediaCardComp>
  </a>
  <CustomModal :isVisible="showZoomModal" @close="showZoomModal = false">
    <MediaViewPanel :imgSrc="buildImageProps(media_file.media['original'])" />
  </CustomModal>
</template>
