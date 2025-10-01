<script setup lang="ts">
import { getCopyrightImagePath, getCopyrightTitle } from '../../utils/copyright'

const props = defineProps<{
  copyrightPermission: number
  copyrightLicense: number
}>()

function imagePath() {
  return getCopyrightImagePath(props.copyrightPermission, props.copyrightLicense)
}

function title() {
  return getCopyrightTitle(props.copyrightPermission, props.copyrightLicense)
}
</script>
<template>
  <img
    :src="`/images/${imagePath()}.png`"
    :title="title()"
    class="copyright-icon"
  />
</template>

<style scoped>
.copyright-icon {
  max-width: 88px;
  height: auto;
  object-fit: contain;
}
</style>
