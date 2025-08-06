<script setup lang="ts">
const props = defineProps<{
  copyrightPermission: number
  copyrightLicense: number
}>()

function imagePath() {
  // Public domain - apply PDM (Public Domain Mark)
  if (props.copyrightPermission === 4) {
    return 'PDM'
  }

  switch (props.copyrightLicense) {
    case 1:
      return 'CC-0'
    case 2:
      return 'CC-BY'
    case 3:
      return 'CC-BY-NC'
    case 4:
      return 'CC-BY-SA'
    case 5:
      return 'CC-BY-NC-SA'
    case 6:
      return 'CC-BY-ND'
    case 7:
      return 'CC-BY-NC-ND'
    default:
      return 'CC-0-gray'
  }
}

function title() {
  // Handle public domain first
  if (props.copyrightPermission === 4) {
    return 'Public Domain Mark - no copyright restrictions'
  }
  
  switch (props.copyrightLicense) {
    case 0:
      return 'Media reuse policy not set'
    case 1:
      return 'CC0 - relinquish copyright'
    case 2:
      return 'Attribution CC BY - reuse with attribution'
    case 3:
      return 'Attribution-NonCommercial CC BY-NC - reuse but noncommercial'
    case 4:
      return 'Attribution-ShareAlike CC BY-SA - reuse here and applied to future uses '
    case 5:
      return 'Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial'
    case 6:
      return 'Attribution-NoDerivs CC BY-ND - reuse but no changes'
    case 7:
      return 'Attribution-NonCommercial-NoDerivs CC BY-NC-ND - reuse noncommerical no changes'
    case 8:
      return 'Media released for onetime use, no reuse without permission'
    case 20:
    default:
      return 'Unknown - Will set before project publication'
  }
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
