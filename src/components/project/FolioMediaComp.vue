<script setup>
import { ref } from 'vue'
import MediaCardComp from './MediaCardComp.vue'
import CustomModal from './CustomModal.vue'
import MediaViewPanel from './MediaViewPanel.vue'
import { buildMediaUrl } from '@/utils/mediaUtils.js'

const props = defineProps({
  media_file: {
    type: Object,
    required: true,
  },
  project_id: {
    type: [Number, String],
    required: false,
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
      :project_id="project_id"
    ></MediaCardComp>
  </a>
  <CustomModal :isVisible="showZoomModal" @close="showZoomModal = false">
    <MediaViewPanel :imgSrc="buildMediaUrl(props.project_id, props.media_file?.media_id, 'large')" />
  </CustomModal>
</template>
