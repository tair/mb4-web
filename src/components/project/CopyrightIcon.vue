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
    width="88"
    height="31"
    :title="title()"
  />
</template>
